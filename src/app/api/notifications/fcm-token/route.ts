import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { token, deviceInfo } = body;

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Upsert FCM token
        const { error: upsertError } = await supabase
            .from('fcm_tokens')
            .upsert({
                user_id: user.id,
                token: token,
                device_type: 'web',
                device_name: deviceInfo?.deviceName || 'Unknown Device',
                browser_info: deviceInfo?.browser || 'Unknown Browser',
                is_active: true,
                last_used_at: new Date().toISOString(),
            }, {
                onConflict: 'token',
                ignoreDuplicates: false,
            });

        if (upsertError) {
            console.error('Error upserting FCM token:', upsertError);
            return NextResponse.json(
                { error: 'Failed to save token', details: upsertError.message },
                { status: 500 }
            );
        }

        // Try to deactivate old tokens (if RPC exists)
        try {
            await supabase.rpc('deactivate_old_fcm_tokens', {
                p_user_id: user.id,
                p_current_token: token,
            });
        } catch (rpcError) {
            console.warn('RPC deactivate_old_fcm_tokens not available or failed:', rpcError);
            // Continue anyway - not critical
        }

        return NextResponse.json(
            { success: true, message: 'FCM token saved successfully' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error in FCM token API:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE endpoint to remove FCM token
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('fcm_tokens')
            .delete()
            .eq('user_id', user.id)
            .eq('token', token);

        if (error) {
            console.error('Error deleting FCM token:', error);
            return NextResponse.json(
                { error: 'Failed to delete token', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'FCM token deleted successfully' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error in FCM token DELETE API:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
