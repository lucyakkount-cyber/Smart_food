
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { chat_id, payment_method, title, description, items, total, currency = 'UZS' } = req.body;

  if (!chat_id || !payment_method || !title || !items || !total) {
    return res.status(400).json({ 
      error: 'Missing required fields: chat_id, payment_method, title, items, total' 
    });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const PAYCOM_PROVIDER_TOKEN = process.env.PAYCOM_PROVIDER_TOKEN;

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error: Missing Bot Token' });
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`;
    
    // Convert items to Telegram invoice price format
    const prices = items.map(item => ({
      label: `${item.name} x${item.count}`,
      amount: item.price * item.count
    }));

    let payload;

    if (payment_method === 'stars') {
      // Telegram Stars payment
      payload = {
        chat_id,
        title,
        description,
        payload: JSON.stringify({
          items,
          timestamp: new Date().toISOString(),
          payment_method: 'stars'
        }),
        currency: 'XTR', // Telegram Stars currency
        prices: prices.map(p => ({
          label: p.label,
          amount: Math.ceil(p.amount / 10000) // Convert UZS to Stars (approximate rate)
        }))
      };
    } else if (payment_method === 'paycom') {
      // Traditional payment via Paycom
      if (!PAYCOM_PROVIDER_TOKEN) {
        return res.status(500).json({ 
          error: 'Server configuration error: Missing Paycom Provider Token' 
        });
      }

      payload = {
        chat_id,
        title,
        description,
        payload: JSON.stringify({
          items,
          timestamp: new Date().toISOString(),
          payment_method: 'paycom'
        }),
        provider_token: PAYCOM_PROVIDER_TOKEN,
        currency: currency,
        prices: prices
      };
    } else {
      return res.status(400).json({ 
        error: 'Invalid payment_method. Must be "stars" or "paycom"' 
      });
    }

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telegram API Error:', data);
      return res.status(response.status).json({ 
        error: data.description || 'Failed to create invoice',
        details: data
      });
    }

    return res.status(200).json({ 
      ok: true, 
      message_id: data.result.message_id,
      invoice_sent: true
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}
