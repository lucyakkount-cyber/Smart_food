
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok' }); // Return 200 even for non-POST to satisfy Telegram webhook verification if needed
  }

  const { body } = req;

  if (!body || !body.message) {
      return res.status(200).json({ status: 'ignored' });
  }

  const hasMessage = !!body.message;
  const chatId = body.message.chat.id;
  const messageText = body.message.text;

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error('Missing TELEGRAM_BOT_TOKEN');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // URL found in original simple_bot.js
  const webAppUrl = 'https://smartfood-bot-for-xasanboy-web.onrender.com';

  try {
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    // Only respond to text messages or commands
    if (hasMessage) {
        const payload = {
            chat_id: chatId,
            text: 'press the button below 👇',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Open App', web_app: { url: webAppUrl } }]
                ]
            }
        };

        await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
