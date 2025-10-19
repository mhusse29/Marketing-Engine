import { supabase } from './supabase';

export type ActivityAction =
  | 'user_signed_in'
  | 'user_signed_up'
  | 'user_signed_out'
  | 'password_reset_requested'
  | 'password_changed'
  | 'email_changed'
  | 'profile_updated'
  | 'avatar_uploaded'
  | 'account_deleted'
  | 'session_revoked';

interface LogActivityParams {
  action: ActivityAction;
  details?: Record<string, unknown>;
}

export async function logActivity({ action, details }: LogActivityParams) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action,
      details,
      ip_address: null, // Could be enhanced to capture actual IP
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function getActivityLogs(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return [];
  }
}
