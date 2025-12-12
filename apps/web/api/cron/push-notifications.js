/**
 * Vercel Cron Job endpoint per processare le notifiche push
 * 
 * Configura in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/push-notifications",
 *     "schedule": "*/5 * * * *"
 *   }]
 * }
 */

// ES modules per compatibilità con il progetto
import { processQueue } from '../../workers/push-notification-worker.js';

export default async function handler(req, res) {
  // Solo GET per cron jobs
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verifica secret (opzionale ma consigliato per sicurezza)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting push notification worker via cron...');
    await processQueue();
    
    return res.status(200).json({ 
      success: true,
      message: 'Queue processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cron error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

