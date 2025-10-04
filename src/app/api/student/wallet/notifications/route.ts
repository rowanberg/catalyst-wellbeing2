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

    const { data: wallet } = await supabase
      .from('student_wallets')
      .select('id')
      .eq('student_id', user.id)
      .single();

    if (!wallet) {
      return NextResponse.json({ notifications: [] });
    }

    const { data: notifications, error } = await supabase
      .from('wallet_notifications')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ notifications: [] });
    }

    const formattedNotifications = (notifications || []).map(n => ({
      id: n.id,
      type: n.notification_type,
      title: n.title,
      message: n.message,
      timestamp: n.created_at,
      read: n.is_read,
      priority: n.priority || 'low'
    }));

    return NextResponse.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
