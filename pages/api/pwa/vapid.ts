import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return VAPID public key for client-side push subscription
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    console.error('VAPID_PUBLIC_KEY not configured');
    return res.status(500).json({
      error: 'Push notifications not configured',
    });
  }

  return res.status(200).json({
    publicKey: vapidPublicKey,
  });
}
