import { supabase } from '@/integrations/supabase/client';

export async function trackEvent(
  eventName: string,
  metadata?: Record<string, unknown>,
  orderId?: string,
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase as any).from('analytics_events').insert({
      event_name: eventName,
      user_id: user.id,
      order_id: orderId || null,
      metadata: metadata || {},
    });
  } catch {
    // Silent — never block UX
  }
}
