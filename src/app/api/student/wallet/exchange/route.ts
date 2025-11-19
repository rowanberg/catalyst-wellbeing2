import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth';

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

export async function POST(request: NextRequest) {
  try {
    const { fromCurrency, toCurrency, amount, password } = await request.json();

    // Validate inputs
    if (!fromCurrency || !toCurrency || !amount || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);

    if (parsedAmount <= 0 || isNaN(parsedAmount)) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json({ error: 'Cannot exchange to same currency' }, { status: 400 });
    }

    const auth = await authenticateStudent(request);
    
    if (isAuthError(auth)) {
      if (auth.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (auth.status === 403) {
        return NextResponse.json({ error: 'Student access required' }, { status: 403 });
      }
      
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status });
    }
    
    const { supabase, userId } = auth;

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('student_wallets')
      .select('*')
      .eq('student_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Verify password
    if (!verifyPassword(password, wallet.transaction_password_hash, wallet.password_salt)) {
      await supabase
        .from('wallet_security_logs')
        .insert({
          wallet_id: wallet.id,
          action_type: 'failed_password',
          action_details: 'Invalid transaction password for exchange',
          success: false
        });

      return NextResponse.json({ error: 'Invalid transaction password' }, { status: 401 });
    }

    // Get exchange rate
    const { data: exchangeRate, error: rateError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .eq('is_active', true)
      .single();

    if (rateError || !exchangeRate) {
      return NextResponse.json({ error: 'Exchange rate not available' }, { status: 404 });
    }

    // Check balance
    const balance = fromCurrency === 'mind_gems' 
      ? wallet.mind_gems_balance 
      : parseFloat(wallet.fluxon_balance);

    if (balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Calculate exchange
    const exchangeAmount = amount * parseFloat(exchangeRate.rate);
    const fee = exchangeAmount * (parseFloat(exchangeRate.fee_percentage) / 100);
    const netAmount = exchangeAmount - fee;

    // Create exchange transaction
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        from_wallet_id: wallet.id,
        to_wallet_id: wallet.id,
        from_address: wallet.wallet_address,
        to_address: wallet.wallet_address,
        currency_type: fromCurrency,
        amount: amount,
        transaction_fee: fee,
        net_amount: netAmount,
        status: 'processing',
        transaction_type: 'exchange',
        description: `Exchange ${amount} ${fromCurrency} to ${netAmount.toFixed(8)} ${toCurrency}`,
        metadata: {
          exchange_rate: exchangeRate.rate,
          fee_percentage: exchangeRate.fee_percentage,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          received_amount: netAmount
        },
        initiated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating exchange transaction:', txError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Update wallet balances
    let updateData: any = {
      wallet_xp: wallet.wallet_xp + 5,
      last_transaction_at: new Date().toISOString()
    };

    if (fromCurrency === 'mind_gems') {
      updateData.mind_gems_balance = wallet.mind_gems_balance - amount;
      updateData.fluxon_balance = (parseFloat(wallet.fluxon_balance) + netAmount).toFixed(8);
    } else {
      updateData.fluxon_balance = (parseFloat(wallet.fluxon_balance) - amount).toFixed(8);
      updateData.mind_gems_balance = wallet.mind_gems_balance + Math.floor(netAmount);
    }

    const { error: updateError } = await supabase
      .from('student_wallets')
      .update(updateData)
      .eq('id', wallet.id);

    if (updateError) {
      // Rollback transaction
      await supabase
        .from('wallet_transactions')
        .update({ status: 'failed', failed_reason: 'Failed to update balance' })
        .eq('id', transaction.id);
      
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // Mark transaction as completed
    await supabase
      .from('wallet_transactions')
      .update({
        status: 'completed',
        confirmations: 1,
        confirmed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    // Create notification
    await supabase
      .from('wallet_notifications')
      .insert({
        wallet_id: wallet.id,
        notification_type: 'exchange_completed',
        title: 'Exchange Completed',
        message: `Successfully exchanged ${amount} ${fromCurrency} for ${netAmount.toFixed(8)} ${toCurrency}`,
        transaction_id: transaction.id,
        priority: 'normal'
      });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        hash: transaction.transaction_hash,
        fromAmount: amount,
        toAmount: netAmount,
        fee: fee,
        rate: exchangeRate.rate,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Error in exchange POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
