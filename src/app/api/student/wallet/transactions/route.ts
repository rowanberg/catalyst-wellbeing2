import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
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
    
    const { userId } = auth;
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Use admin client for database operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('student_wallets')
      .select('id, wallet_address')
      .eq('student_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Get transactions
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .or(`from_wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) {
      console.error('Error fetching transactions:', txError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Remove duplicates and format transactions
    const uniqueTransactions = new Map();
    
    (transactions || []).forEach(tx => {
      // Use transaction ID as unique key to prevent duplicates
      if (!uniqueTransactions.has(tx.id)) {
        // Determine transaction direction
        const isSent = tx.from_wallet_id === wallet.id;
        const isReceived = tx.to_wallet_id === wallet.id;
        const isSelfTransfer = tx.from_wallet_id === tx.to_wallet_id;
        
        uniqueTransactions.set(tx.id, {
          id: tx.id,
          transactionHash: tx.transaction_hash,
          fromAddress: tx.from_address,
          toAddress: tx.to_address,
          currencyType: tx.currency_type,
          amount: parseFloat(tx.amount),
          status: tx.status,
          transactionType: tx.transaction_type,
          description: tx.description,
          memo: tx.memo,
          createdAt: tx.created_at,
          completedAt: tx.completed_at,
          // Add direction indicators
          direction: isSelfTransfer ? 'self' : isSent ? 'sent' : 'received',
          isSent: isSent,
          isReceived: isReceived,
          isSelfTransfer: isSelfTransfer
        });
      }
    });

    const formattedTransactions = Array.from(uniqueTransactions.values());

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('Error in transactions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
