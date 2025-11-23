import webpush from 'https://esm.sh/web-push@3.6.6';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@tradelens.app';

// Configure web-push
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: any;
}

export async function sendPushNotification(
  subscription: any,
  notification: PushNotification
) {
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || '/icon-192x192.png',
    badge: notification.badge || '/badge-72x72.png',
    url: notification.url || '/',
    data: notification.data || {},
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    throw error;
  }
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
