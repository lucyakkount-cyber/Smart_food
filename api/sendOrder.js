
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { chat_id, message, photo_url } = req.body;

  if (!chat_id || !message) {
    return res.status(400).json({ error: 'Missing chat_id or message' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error: Missing Bot Token' });
  }

  try {
    let telegramUrl;
    let payload;

    if (photo_url) {
      telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
      payload = {
        chat_id,
        photo: photo_url,
        caption: message,
        parse_mode: 'HTML'
      };
    } else {
      telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      payload = {
        chat_id,
        text: message,
        parse_mode: 'HTML'
      };
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
      return res.status(response.status).json({ error: data.description || 'Failed to send message' });
    }

    return res.status(200).json({ ok: true, result: data.result });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
