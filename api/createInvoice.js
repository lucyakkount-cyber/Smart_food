
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
    
    // Add each item with data-item-id and count
    items.forEach((item, index) => {
      // Use a simple key based on item name (sanitized)
      const itemKey = item.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      urlParams.append('data-item-id', itemKey)
      urlParams.append('count', item.count)
      if (index === 0 && item.comment) {
        urlParams.append('comment', item.comment)
      }
    })
    
    const fullUrl = `${orderUrl}?${urlParams.toString()}`
    console.log('Generated URL:', fullUrl)

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
        payload: `order_${Date.now()}_stars`, // Simple URL-safe string under 128 bytes
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
        payload: `order_${Date.now()}_paycom`, // Simple URL-safe string under 128 bytes
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

    const invoiceMessageId = data.result.message_id

    // Send a separate message with Pay button and order details
    const messageUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
    
    // Build message text with emojis and details
    let messageText = ''
    
    if (payment_method === 'stars') {
      // Calculate conversion rate (1 Star ≈ 10,000 UZS based on our conversion)
      const totalStars = Math.ceil(total / 10000)
      const starsToUzs = 10000
      
      messageText += `⭐ *Telegram Stars To'lov*\n\n`
      messageText += `💰 *Jami:* ${totalStars} ⭐ (≈ ${total.toLocaleString()} so'm)\n`
      messageText += `📊 *Kurs:* 1 ⭐ = ${starsToUzs.toLocaleString()} so'm\n`
      
      if (description && description !== 'Ovqat buyurtmasi') {
        messageText += `\n💬 *Izoh:* ${description}`
      }
      
      messageText += `\n\n✅ To'lash uchun quyidagi tugmani bosing!`
    } else {
      messageText += `💳 *Karta orqali to'lov*\n\n`
      messageText += `💰 *Jami:* ${total.toLocaleString()} so'm\n`
      
      if (description && description !== 'Ovqat buyurtmasi') {
        messageText += `\n💬 *Izoh:* ${description}`
      }
      
      messageText += `\n\n✅ To'lash uchun quyidagi tugmani bosing!`
    }
    
    try {
      const buttonResponse = await fetch(messageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id,
          text: messageText,
          parse_mode: 'Markdown',
          reply_to_message_id: invoiceMessageId,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: payment_method === 'stars' ? '⭐ Stars bilan to\'lash' : '💳 Karta bilan to\'lash',
                  pay: true,
                },
              ],
            ],
          },
        }),
      })
      
      const buttonData = await buttonResponse.json()
      
      if (!buttonResponse.ok) {
        console.error('Button message error:', buttonData)
      } else {
        console.log('Button message sent successfully:', buttonData)
      }
    } catch (err) {
      console.error('Error sending button message:', err)
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
