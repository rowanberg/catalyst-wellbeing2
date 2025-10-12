import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { withRateLimit } from '@/lib/security/rateLimiter';
import { logWallet, logSecurity, AUDIT_EVENTS } from '@/lib/security/auditLogger';

async function verifyPassword(password: string, hash: string, salt?: string): Promise<boolean> {
  if (!salt) {
    // Fallback to SHA256 for wallets created with old method
    const testHash = crypto.createHash('sha256').update(password).digest('hex');
    return testHash === hash;
  } else if (salt.startsWith('$2b$') || salt.startsWith('$2a$')) {
    // New bcrypt format - salt is included in the hash
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  } else {
    // Legacy PBKDF2 format
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return testHash === hash;
  }
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
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
      
      // Sanitize inputs to prevent XSS
      const sanitizedMemo = memo?.replace(/<[^>]*>/g, '').trim() || '';
      const sanitizedAmount = parseFloat(amount.toString());
    
    // Generate unique request ID if not provided
    const uniqueRequestId = requestId || `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    // Validate inputs - accept either wallet address or student tag
    if ((!toAddress && !toStudentTag) || !amount || !currencyType || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

      if (sanitizedAmount <= 0 || isNaN(sanitizedAmount) || !isFinite(sanitizedAmount)) {
        return NextResponse.json({ error: 'Invalid amount specified' }, { status: 400 });
      }
      
      // Add maximum transaction limits
      const maxLimits = {
        mind_gems: 10000,
        fluxon: 1000
      };
      
      if (sanitizedAmount > maxLimits[currencyType as keyof typeof maxLimits]) {
        return NextResponse.json({ 
          error: `Amount exceeds maximum limit of ${maxLimits[currencyType as keyof typeof maxLimits]} ${currencyType}`
        }, { status: 400 });
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
    
      const isPasswordValid = await verifyPassword(password, senderWallet.transaction_password_hash, senderWallet.password_salt);
      if (!isPasswordValid) {
        // Audit log failed password attempt
        await logWallet(
          AUDIT_EVENTS.WALLET_PASSWORD_FAILED,
          senderWallet.id,
          user.id,
          {
            attempted_amount: sanitizedAmount,
            currency_type: currencyType,
            recipient: toStudentTag || toAddress,
            attempt_count: (senderWallet.failed_password_attempts || 0) + 1
          },
          false,
          request
        );

        // Log failed attempt in security logs
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
            failed_password_attempts: (senderWallet.failed_password_attempts || 0) + 1
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

      // Execute atomic transaction using database function (prevents race conditions)
      const { data: transactionResult, error: txError } = await supabaseAdmin
        .rpc('execute_wallet_transaction', {
          p_sender_wallet_id: senderWallet.id,
          p_recipient_wallet_id: recipientWallet.id,
          p_currency_type: currencyType,
          p_amount: sanitizedAmount,
          p_memo: sanitizedMemo,
          p_transaction_hash: crypto.randomBytes(32).toString('hex')
        });

      if (txError || !transactionResult?.success) {
        // Audit log failed transaction
        await logWallet(
          AUDIT_EVENTS.WALLET_TRANSACTION,
          senderWallet.id,
          user.id,
          {
            amount: sanitizedAmount,
            currency_type: currencyType,
            recipient: toStudentTag || toAddress,
            error: transactionResult?.error || txError?.message
          },
          false,
          request
        );

        console.error('Transaction failed:', txError || transactionResult?.error);
        return NextResponse.json({ 
          error: transactionResult?.error || 'Transaction failed. Please try again.',
          code: 'TRANSACTION_FAILED'
        }, { status: 400 });
      }

      // Audit log successful transaction
      await logWallet(
        AUDIT_EVENTS.WALLET_TRANSACTION,
        senderWallet.id,
        user.id,
        {
          transaction_id: transactionResult.transaction_id,
          amount: sanitizedAmount,
          currency_type: currencyType,
          recipient: toStudentTag || toAddress,
          recipient_wallet_id: recipientWallet.id,
          memo: sanitizedMemo,
          new_sender_balance: transactionResult.new_sender_balance,
          new_recipient_balance: transactionResult.new_recipient_balance
        },
        true,
        request
      );

      // Create notification for recipient (optional - won't fail transaction if this fails)
      try {
        await supabaseAdmin
          .from('wallet_notifications')
          .insert({
            wallet_id: recipientWallet.id,
            notification_type: 'received_payment',
            title: 'Payment Received',
            message: `You received ${sanitizedAmount} ${currencyType === 'mind_gems' ? 'Mind Gems' : 'Fluxon'} from ${senderWallet.wallet_nickname || senderWallet.wallet_address}`,
            transaction_id: transactionResult.transaction_id,
            priority: 'normal'
          });
      } catch (notificationError) {
        console.error('Failed to create notification (non-critical)');
      }

      // Update profile gems for dashboard sync (optional - won't fail transaction)
      if (currencyType === 'mind_gems') {
        try {
          // Update sender profile
          await supabaseAdmin
            .from('profiles')
            .update({ gems: transactionResult.new_sender_balance })
            .eq('user_id', user.id);
          
          // Update recipient profile (if different user)
          if (senderWallet.id !== recipientWallet.id) {
            await supabaseAdmin
              .from('profiles')
              .update({ gems: transactionResult.new_recipient_balance })
              .eq('user_id', recipientProfile.user_id);
          }
        } catch (profileError) {
          console.error('Failed to update profile gems (non-critical)');
        }
      }

      // Check for achievements (optional)
      try {
        await supabaseAdmin.rpc('check_wallet_achievements', { wallet_uuid: senderWallet.id });
      } catch (achievementError) {
        console.error('Failed to check achievements (non-critical)');
      }

      return NextResponse.json({
        success: true,
        transaction: {
          id: transactionResult.transaction_id,
          amount: sanitizedAmount,
          fee: 0,
          status: 'completed'
        }
      });

    } catch (error) {
      console.error('Error in wallet send transaction');
      // Never expose internal error details to client
      return NextResponse.json({ 
        error: 'Transaction failed. Please try again.',
        code: 'TRANSACTION_ERROR'
      }, { status: 500 });
    }
  }, 'wallet');
}
