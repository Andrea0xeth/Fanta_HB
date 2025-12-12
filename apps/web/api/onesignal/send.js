/**
 * Endpoint API per inviare notifiche tramite OneSignal
 * 
 * Questo endpoint gestisce l'autenticazione con la REST API Key di OneSignal
 * in modo sicuro (la chiave non è esposta nel frontend)
 */

// Helper per impostare CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  // Imposta CORS headers per tutte le risposte
  setCorsHeaders(res);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payload, filters } = req.body;

    if (!payload || !payload.title || !payload.body) {
      return res.status(400).json({ error: 'payload.title and payload.body are required' });
    }

    // OneSignal REST API Key (deve essere configurata come variabile d'ambiente su Vercel)
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
    const ONESIGNAL_APP_ID = '2ff6202e-418d-415f-8250-24b8c75b2b4f';

    if (!ONESIGNAL_REST_API_KEY) {
      console.error('ONESIGNAL_REST_API_KEY non configurata');
      return res.status(500).json({ error: 'OneSignal REST API Key non configurata' });
    }

    // Prepara il payload per OneSignal
    const oneSignalPayload = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: payload.title },
      contents: { en: payload.body },
      url: payload.url || '/',
      chrome_web_icon: payload.icon || '/pwa-192x192.png',
      chrome_web_badge: payload.badge || '/pwa-192x192.png',
      data: payload.data || {},
    };

    // Aggiungi filtri se specificati
    if (filters && filters.length > 0) {
      oneSignalPayload.filters = filters;
    }

    // Invia la notifica tramite OneSignal REST API
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(oneSignalPayload),
    });

    if (!oneSignalResponse.ok) {
      const errorData = await oneSignalResponse.json().catch(() => ({}));
      console.error('[OneSignal] Errore API:', errorData);
      return res.status(oneSignalResponse.status).json({
        error: 'Errore durante l\'invio della notifica OneSignal',
        details: errorData,
      });
    }

    const oneSignalData = await oneSignalResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Notifica inviata con successo',
      oneSignalId: oneSignalData.id,
      recipients: oneSignalData.recipients,
    });
  } catch (error) {
    console.error('❌ Error sending OneSignal notification:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

