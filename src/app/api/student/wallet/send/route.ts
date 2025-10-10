import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function verifyPassword(password: string, hash: string, salt?: string): boolean {
  if (!salt) {
    // Fallback to SHA256 for wallets created with old method
    const testHash = crypto.createHash('sha256').update(password).digest('hex');
    return testHash === hash;
  } else {
    // Use PBKDF2 for newer wallets
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return testHash === hash;
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore server component errors
            }
          },
        },
      }
    );
    const { toAddress, toStudentTag, amount, currencyType, memo, password, requestId } = await request.json();
    
    // Generate unique request ID if not provided
    const uniqueRequestId = requestId || `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    // Validate inputs - accept either wallet address or student tag
    if ((!toAddress && !toStudentTag) || !amount || !currencyType || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS for wallet operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, get the sender's wallet
    const { data: senderWallet, error: walletError } = await supabaseAdmin
      .from('student_wallets')
      .select('*')
      .eq('student_id', user.id)
      .single();


    if (walletError || !senderWallet) {
      return NextResponse.json({ 
        error: 'Sender wallet not found. Please create a wallet first.',
        details: 'You need to set up your wallet before sending currency.'
      }, { status: 404 });
    }

    // Get the sender's profile separately to get student_tag
    const { data: senderProfile } = await supabaseAdmin
      .from('profiles')
      .select('student_tag, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    // Verify password
    
    if (!senderWallet.transaction_password_hash) {
      return NextResponse.json({ 
        error: 'Transaction password not set up. Please set up your transaction password first.',
        details: 'Your wallet needs a transaction password before you can send currency.'
      }, { status: 400 });
    }
    
    if (!verifyPassword(password, senderWallet.transaction_password_hash, senderWallet.password_salt)) {
      // Log failed attempt
      await supabaseAdmin
        .from('wallet_security_logs')
        .insert({
          wallet_id: senderWallet.id,
          action_type: 'failed_password',
          action_details: 'Invalid transaction password',
          success: false
        });

      // Increment failed attempts
      await supabaseAdmin
        .from('student_wallets')
        .update({
          failed_password_attempts: senderWallet.failed_password_attempts + 1
        })
        .eq('id', senderWallet.id);

      return NextResponse.json({ error: 'Invalid transaction password' }, { status: 401 });
    }

    // Check if wallet is locked
    if (senderWallet.is_locked) {
      return NextResponse.json({ error: 'Wallet is locked' }, { status: 403 });
    }
    // Check balance
    const balance = currencyType === 'mind_gems' 
      ? senderWallet.mind_gems_balance 
      : parseFloat(senderWallet.fluxon_balance);

    // Calculate total amount (no fees for now)
    const totalAmount = amount;

    if (balance < totalAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }
    // Check daily limits
    const dailySpent = currencyType === 'mind_gems'
      ? senderWallet.daily_spent_gems
      : parseFloat(senderWallet.daily_spent_fluxon);
    
    const dailyLimit = currencyType === 'mind_gems'
      ? senderWallet.daily_limit_gems
      : parseFloat(senderWallet.daily_limit_fluxon);

    if (dailySpent + amount > dailyLimit) {
      return NextResponse.json({ error: 'Daily limit exceeded' }, { status: 400 });
    }
    // Get recipient wallet - support both wallet address and student tag
    let recipientWallet;
    let recipientProfile;
    
    if (toStudentTag) {
      // Lookup by student tag
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, first_name, last_name, student_tag')
        .eq('student_tag', toStudentTag)
        .eq('role', 'student')
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Student tag not found' }, { status: 404 });
      }

      recipientProfile = profile;

      // Get recipient wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('student_wallets')
        .select('*')
        .eq('student_id', profile.user_id)
        .single();

      if (walletError || !wallet) {
        return NextResponse.json({ error: 'Recipient wallet not found' }, { status: 404 });
      }

      recipientWallet = wallet;
    } else {
      // Lookup by wallet address
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('student_wallets')
        .select('*, profiles!inner(student_tag, first_name, last_name)')
        .eq('wallet_address', toAddress)
        .single();

      if (walletError || !wallet) {
        return NextResponse.json({ error: 'Recipient wallet not found' }, { status: 404 });
      }

      recipientWallet = wallet;
      recipientProfile = wallet.profiles;
    }

    // Generate transaction hash
    const generateTransactionHash = (): string => {
      const timestamp = Date.now().toString();
      const random = crypto.randomBytes(16).toString('hex');
      return crypto.createHash('sha256').update(timestamp + random).digest('hex');
    };

    // Start transaction with minimal required fields - try different combinations
    let transaction, txError;
    
    // First attempt with common field values
    const transactionData = {
      from_wallet_id: senderWallet.id,
      to_wallet_id: recipientWallet.id,
      from_address: senderWallet.wallet_address,
      to_address: recipientWallet.wallet_address,
      currency_type: currencyType,
      amount: amount,
      transaction_hash: generateTransactionHash(),
      memo: memo || ''
    };

    // Try different status and transaction_type combinations
    const attempts = [
      { status: 'completed', transaction_type: 'send' },
      { status: 'success', transaction_type: 'send' },
      { status: 'completed', transaction_type: 'payment' },
      { status: 'success', transaction_type: 'payment' },
      { status: 'completed', transaction_type: 'transfer' },
      { status: 'pending', transaction_type: 'send' }
    ];

    for (const attempt of attempts) {
      const result = await supabaseAdmin
        .from('wallet_transactions')
        .insert({ ...transactionData, ...attempt })
        .select()
        .single();
      
      if (!result.error) {
        transaction = result.data;
        txError = null;
        break; // Exit immediately after first success
      } else {
        txError = result.error;
        // Continue to next attempt only if this one failed
      }
    }

    if (txError) {
      console.error('Error creating transaction:', txError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Update sender balance
    const newSenderBalance = currencyType === 'mind_gems'
      ? { 
          mind_gems_balance: senderWallet.mind_gems_balance - totalAmount,
          daily_spent_gems: senderWallet.daily_spent_gems + amount,
          total_transactions_sent: senderWallet.total_transactions_sent + 1
        }
      : {
          fluxon_balance: (parseFloat(senderWallet.fluxon_balance) - totalAmount).toFixed(8),
          daily_spent_fluxon: (parseFloat(senderWallet.daily_spent_fluxon) + amount).toFixed(8),
          total_transactions_sent: senderWallet.total_transactions_sent + 1
        };

    const { error: senderUpdateError } = await supabaseAdmin
      .from('student_wallets')
      .update({
        ...newSenderBalance,
        last_transaction_at: new Date().toISOString(),
        wallet_xp: senderWallet.wallet_xp + 10
      })
      .eq('id', senderWallet.id);

    if (senderUpdateError) {
      // Rollback transaction
      await supabaseAdmin
        .from('wallet_transactions')
        .update({ status: 'failed', failed_reason: 'Failed to update sender balance' })
        .eq('id', transaction.id);
      
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // Update sender profile gems (for mind gems only - sync with dashboard)
    if (currencyType === 'mind_gems') {
      const { error: senderProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
          gems: senderWallet.mind_gems_balance - totalAmount
        })
        .eq('user_id', user.id);

      if (senderProfileError) {
        console.error('Failed to update sender profile gems:', senderProfileError);
        // Don't fail the transaction, but log the error
      }
    }

    // Update recipient balance (only if not sending to self)
    const isSelfTransfer = senderWallet.id === recipientWallet.id;
    let recipientUpdateError: any = null;
    
    if (!isSelfTransfer) {
      const newRecipientBalance = currencyType === 'mind_gems'
        ? { 
            mind_gems_balance: recipientWallet.mind_gems_balance + amount,
            total_transactions_received: recipientWallet.total_transactions_received + 1
          }
        : {
            fluxon_balance: (parseFloat(recipientWallet.fluxon_balance) + amount).toFixed(8),
            total_transactions_received: recipientWallet.total_transactions_received + 1
          };

      const result = await supabaseAdmin
        .from('student_wallets')
        .update(newRecipientBalance)
        .eq('id', recipientWallet.id);
      
      recipientUpdateError = result.error;
    }

    if (recipientUpdateError) {
      // Rollback sender balance
      await supabaseAdmin
        .from('student_wallets')
        .update({
          ...senderWallet,
          updated_at: new Date().toISOString()
        })
        .eq('id', senderWallet.id);

      // Mark transaction as failed
      await supabaseAdmin
        .from('wallet_transactions')
        .update({ status: 'failed', failed_reason: 'Failed to update recipient balance' })
        .eq('id', transaction.id);
      
      return NextResponse.json({ error: 'Failed to complete transaction' }, { status: 500 });
    }

    // Update recipient profile gems (for mind gems only - sync with dashboard)
    if (currencyType === 'mind_gems' && !isSelfTransfer) {
      const { error: recipientProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
          gems: recipientWallet.mind_gems_balance + amount
        })
        .eq('user_id', recipientProfile.user_id);

      if (recipientProfileError) {
        console.error('Failed to update recipient profile gems:', recipientProfileError);
        // Don't fail the transaction, but log the error
      }
    }

    // Mark transaction as completed
    const { error: completeTxError } = await supabaseAdmin
      .from('wallet_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (completeTxError) {
      console.error('Error completing transaction:', completeTxError);
    }

    // Create notification for recipient
    await supabaseAdmin
      .from('wallet_notifications')
      .insert({
        wallet_id: recipientWallet.id,
        notification_type: 'received_payment',
        title: 'Payment Received',
        message: `You received ${amount} ${currencyType === 'mind_gems' ? 'Mind Gems' : 'Fluxon'} from ${senderWallet.wallet_nickname || senderWallet.wallet_address}`,
        transaction_id: transaction.id,
        priority: 'normal'
      });

    // Check for achievements
    await supabaseAdmin.rpc('check_wallet_achievements', { wallet_uuid: senderWallet.id });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        hash: transaction.transaction_hash,
        amount: amount,
        fee: 0,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('=== Error in wallet send ===');
    console.error('Full error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
