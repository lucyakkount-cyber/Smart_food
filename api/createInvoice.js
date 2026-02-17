
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { chat_id, payment_method, title, description, items, total, currency = 'UZS', web_app_url } = req.body

  if (!chat_id || !payment_method || !title || !items || !total) {
    return res.status(400).json({ 
      error: 'Missing required fields: chat_id, payment_method, title, items, total',
    })
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const PAYMENT_PROVIDER_TOKEN = process.env.PAYMENT_PROVIDER_TOKEN

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error: Missing Bot Token' })
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`
    
    // Build detailed description with itemized list
    let detailedDescription = 'Ovqat buyurtmasi:\n\n'
    items.forEach(item => {
      detailedDescription += `${item.name} x${item.count} - ${(item.price * item.count).toLocaleString()} so'm\n`
    })
    detailedDescription += `\nJami: ${total.toLocaleString()} so'm`

    // Build URL with order parameters for revisiting
    let orderUrl = web_app_url || 'https://t.me/your_bot'
    const urlParams = new URLSearchParams()
    items.forEach(item => {
      // Convert item name to URL-friendly format (lowercase, replace spaces with underscores)
      const itemKey = item.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      urlParams.append(itemKey, item.count)
    })
    const fullUrl = `${orderUrl}?${urlParams.toString()}`

    // Convert items to Telegram invoice price format
    const prices = items.map(item => ({
      label: `${item.name} x${item.count}`,
      amount: item.price * item.count,
    }))

    let payload

    if (payment_method === 'stars') {
      // Telegram Stars payment
      payload = {
        chat_id,
        title,
        description: detailedDescription,
        payload: JSON.stringify({
          items,
          timestamp: new Date().toISOString(),
          payment_method: 'stars',
        }),
        currency: 'XTR', // Telegram Stars currency
        prices: prices.map(p => ({
          label: p.label,
          amount: Math.ceil(p.amount / 10000), // Convert UZS to Stars (approximate rate)
        })),
      }
    } else if (payment_method === 'paycom') {
      if (!PAYMENT_PROVIDER_TOKEN) {
        return res.status(500).json({ 
          error: 'Server configuration error: Missing Payment Provider Token',
        })
      }

      // For UZS, Telegram expects amount in tiyin (1 UZS = 100 tiyin)
      payload = {
        chat_id,
        title,
        description: detailedDescription,
        payload: JSON.stringify({
          items,
          timestamp: new Date().toISOString(),
          payment_method: 'paycom',
        }),
        provider_token: PAYMENT_PROVIDER_TOKEN,
        currency: currency,
        prices: prices.map(p => ({
          label: p.label,
          amount: p.amount * 100, // Convert UZS to tiyin (smallest unit)
        })),
      }
    } else {
      return res.status(400).json({ 
        error: 'Invalid payment_method. Must be "stars" or "paycom"',
      })
    }

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Telegram API Error:', data)
      return res.status(response.status).json({ 
        error: data.description || 'Failed to create invoice',
        details: data,
      })
    }

    // Send a separate message with action buttons (for both payment methods)
    if (fullUrl) {
      const messageUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
      await fetch(messageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id,
          text: '💡 Buyurtmangizni to\'lang yoki qayta tahrirlash uchun quyidagi tugmalarni bosing:',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: payment_method === 'stars' ? '⭐ To\'lash' : '💳 To\'lash',
                  pay: true,
                },
              ],
              [
                {
                  text: '🔄 Bozorni qayta ochish',
                  url: fullUrl,
                },
              ],
            ],
          },
        }),
      })
    }

    return res.status(200).json({ 
      ok: true, 
      message_id: data.result.message_id,
      invoice_sent: true,
    })

  } catch (error) {
    console.error('Server Error:', error)
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message,
    })
  }
}
