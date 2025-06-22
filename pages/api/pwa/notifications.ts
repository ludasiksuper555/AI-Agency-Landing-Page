import { NextApiRequest, NextApiResponse } from 'next';
import webpush from 'web-push';

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

// In-memory storage for subscriptions (use database in production)
const subscriptions = new Set<string>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await handleSubscribe(req, res);
      case 'DELETE':
        return await handleUnsubscribe(req, res);
      case 'PUT':
        return await handleSendNotification(req, res);
      default:
        res.setHeader('Allow', ['POST', 'DELETE', 'PUT']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notification API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Subscribe to push notifications
async function handleSubscribe(req: NextApiRequest, res: NextApiResponse) {
  const { subscription } = req.body as { subscription: PushSubscription };

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription data' });
  }

  // Store subscription (in production, save to database)
  subscriptions.add(JSON.stringify(subscription));

  console.log('New push subscription:', subscription.endpoint);

  // Send welcome notification
  try {
    const payload: NotificationPayload = {
      title: 'Ласкаво просимо до Trae AI Agency!',
      body: 'Ви успішно підписалися на push-повідомлення.',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/badge-72x72.png',
      data: {
        url: '/',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'Відкрити сайт',
        },
        {
          action: 'close',
          title: 'Закрити',
        },
      ],
    };

    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to send welcome notification:', error);
  }

  return res.status(201).json({ message: 'Subscription successful' });
}

// Unsubscribe from push notifications
async function handleUnsubscribe(req: NextApiRequest, res: NextApiResponse) {
  const { endpoint } = req.body as { endpoint: string };

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint required' });
  }

  // Remove subscription (in production, remove from database)
  for (const sub of subscriptions) {
    const subscription = JSON.parse(sub);
    if (subscription.endpoint === endpoint) {
      subscriptions.delete(sub);
      break;
    }
  }

  console.log('Push subscription removed:', endpoint);

  return res.status(200).json({ message: 'Unsubscription successful' });
}

// Send notification to all subscribers
async function handleSendNotification(req: NextApiRequest, res: NextApiResponse) {
  const { payload, targetEndpoint } = req.body as {
    payload: NotificationPayload;
    targetEndpoint?: string;
  };

  if (!payload || !payload.title) {
    return res.status(400).json({ error: 'Invalid notification payload' });
  }

  // Validate API key for sending notifications
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (apiKey !== process.env.NOTIFICATION_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Send to specific endpoint or all subscribers
  const targetSubscriptions = targetEndpoint
    ? Array.from(subscriptions).filter(sub => {
        const subscription = JSON.parse(sub);
        return subscription.endpoint === targetEndpoint;
      })
    : Array.from(subscriptions);

  for (const sub of targetSubscriptions) {
    try {
      const subscription = JSON.parse(sub);
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      results.successful++;
    } catch (error) {
      console.error('Failed to send notification:', error);
      results.failed++;
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');

      // Remove invalid subscriptions
      if (error instanceof Error && error.message.includes('410')) {
        subscriptions.delete(sub);
      }
    }
  }

  console.log('Notification send results:', results);

  return res.status(200).json({
    message: 'Notifications sent',
    results,
  });
}

// Helper function to send predefined notifications
export async function sendSystemNotification(
  type: 'update' | 'maintenance' | 'news' | 'alert',
  customPayload?: Partial<NotificationPayload>
) {
  const basePayloads = {
    update: {
      title: 'Доступне оновлення',
      body: 'Нова версія додатку готова до встановлення.',
      icon: '/icons/icon-192x192.svg',
      data: { type: 'update', url: '/' },
      actions: [
        { action: 'update', title: 'Оновити' },
        { action: 'later', title: 'Пізніше' },
      ],
    },
    maintenance: {
      title: 'Технічні роботи',
      body: 'Заплановані технічні роботи з 02:00 до 04:00.',
      icon: '/icons/icon-192x192.svg',
      data: { type: 'maintenance' },
    },
    news: {
      title: 'Новини Trae AI Agency',
      body: 'Ознайомтеся з останніми новинами та оновленнями.',
      icon: '/icons/icon-192x192.svg',
      data: { type: 'news', url: '/news' },
      actions: [
        { action: 'read', title: 'Читати' },
        { action: 'dismiss', title: 'Відхилити' },
      ],
    },
    alert: {
      title: 'Важливе повідомлення',
      body: 'Термінове повідомлення від Trae AI Agency.',
      icon: '/icons/icon-192x192.svg',
      requireInteraction: true,
      data: { type: 'alert' },
    },
  };

  const payload = { ...basePayloads[type], ...customPayload };

  // Send to all subscribers
  for (const sub of subscriptions) {
    try {
      const subscription = JSON.parse(sub);
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to send system notification:', error);

      // Remove invalid subscriptions
      if (error instanceof Error && error.message.includes('410')) {
        subscriptions.delete(sub);
      }
    }
  }
}

// Export subscription count for monitoring
export function getSubscriptionCount(): number {
  return subscriptions.size;
}
