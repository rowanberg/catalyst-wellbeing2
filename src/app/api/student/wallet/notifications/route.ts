import { NextRequest, NextResponse } from 'next/server';
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
    
    const { supabase, userId } = auth;

    const { data: wallet } = await supabase
      .from('student_wallets')
      .select('id')
      .eq('student_id', userId)
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
