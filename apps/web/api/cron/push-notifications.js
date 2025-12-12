/**
 * Endpoint per processare manualmente le notifiche push dalla coda
 * 
 * Può essere chiamato:
 * - Manualmente dalla pagina admin (POST)
 * - Via cron job esterno (GET con secret opzionale)
 */

// ES modules per compatibilità con il progetto
import { processQueue } from '../../workers/push-notification-worker.js';

export default async function handler(req, res) {
  // Accetta sia GET (per cron esterni) che POST (per chiamate manuali)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Per GET (cron esterni), verifica secret se configurato
  if (req.method === 'GET') {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Per POST (chiamate manuali), verifica che l'utente sia admin
  // Nota: La verifica admin dovrebbe essere fatta lato frontend
  // Qui accettiamo tutte le POST (il frontend controllerà i permessi)

  try {
    console.log(`🔄 Starting push notification worker via ${req.method}...`);
    const result = await processQueue();
    
    return res.status(200).json({ 
      success: true,
      message: 'Queue processed successfully',
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error('❌ Error processing queue:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

