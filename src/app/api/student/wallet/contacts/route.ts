import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get frequent transaction partners
    const { data: sentTransactions } = await supabase
      .from('wallet_transactions')
      .select('to_wallet_id, to_address, to_student_tag')
      .eq('from_wallet_id', (await supabase.from('student_wallets').select('id').eq('student_id', user.id).single()).data?.id)
      .eq('status', 'completed');

    const { data: receivedTransactions } = await supabase
      .from('wallet_transactions')
      .select('from_wallet_id, from_address, from_student_tag')
      .eq('to_wallet_id', (await supabase.from('student_wallets').select('id').eq('student_id', user.id).single()).data?.id)
      .eq('status', 'completed');

    // Count transactions per contact
    const contactCounts = new Map<string, number>();
    
    sentTransactions?.forEach(tx => {
      const key = tx.to_student_tag || tx.to_address;
      contactCounts.set(key, (contactCounts.get(key) || 0) + 1);
    });

    receivedTransactions?.forEach(tx => {
      const key = tx.from_student_tag || tx.from_address;
      contactCounts.set(key, (contactCounts.get(key) || 0) + 1);
    });

    // Get contact details
    const contacts: any[] = [];
    const contactEntries = Array.from(contactCounts.entries());
    
    for (let i = 0; i < contactEntries.length; i++) {
      const [tag, count] = contactEntries[i];
      if (count >= 2) { // Only show contacts with 2+ transactions
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, student_tag')
          .eq('student_tag', tag)
          .single();

        if (profile) {
          const { data: wallet } = await supabase
            .from('student_wallets')
            .select('wallet_address')
            .eq('student_id', profile.id)
            .single();

          contacts.push({
            id: profile.id,
            studentTag: profile.student_tag,
            fullName: `${profile.first_name} ${profile.last_name}`,
            walletAddress: wallet?.wallet_address || '',
            isFavorite: false,
            transactionCount: count
          });
        }
      }
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error in contacts GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
