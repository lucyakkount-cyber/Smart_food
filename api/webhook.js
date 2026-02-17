
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error('Missing TELEGRAM_BOT_TOKEN');
    return res.status(500).json({ error: 'Missing Bot Token' });
  }

  try {
    const update = req.body;
    console.log('Webhook received:', JSON.stringify(update, null, 2));

    // Handle pre-checkout query (before payment is processed)
    if (update.pre_checkout_query) {
      await handlePreCheckout(update.pre_checkout_query, BOT_TOKEN);
    }

    // Handle successful payment
    if (update.message && update.message.successful_payment) {
      await handleSuccessfulPayment(update.message, BOT_TOKEN);
    }

    // Handle regular messages if needed
    if (update.message && !update.message.successful_payment) {
      console.log('Message received:', update.message);
    }

    // Handle callback queries if needed
    if (update.callback_query) {
      console.log('Callback query:', update.callback_query);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function handlePreCheckout(preCheckoutQuery, botToken) {
  const { id, from, total_amount, invoice_payload } = preCheckoutQuery;
  
  console.log('Pre-checkout query received:', {
    user: from.username || from.first_name,
    amount: total_amount,
    payload: invoice_payload,
  });

  let isValid = true;
  let errorMessage = null;

  try {
    const payload = JSON.parse(invoice_payload);
    
    if (!payload.items || payload.items.length === 0) {
      isValid = false;
      errorMessage = 'Invalid order: no items found';
    }
  } catch (e) {
    isValid = false;
    errorMessage = 'Invalid order data';
  }

  const answerUrl = `https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`;
  const answer = {
    pre_checkout_query_id: id,
    ok: isValid,
  };

  if (!isValid) {
    answer.error_message = errorMessage;
  }

  const response = await fetch(answerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answer),
  });

  const data = await response.json();
  console.log('Pre-checkout answer sent:', data);
}

async function handleSuccessfulPayment(message, botToken) {
  const { from, chat, successful_payment } = message;
  const { total_amount, invoice_payload, telegram_payment_charge_id } = successful_payment;

  console.log('Payment successful:', {
    user: from.username || from.first_name,
    amount: total_amount,
    charge_id: telegram_payment_charge_id,
  });

  try {
    const payload = JSON.parse(invoice_payload);
    
    let orderMessage = `<b>✅ Payment Received!</b>\n\n`;
    orderMessage += `<b>Customer:</b> ${from.first_name} ${from.username ? `(@${from.username})` : ''}\n`;
    orderMessage += `<b>ID:</b> <code>${from.id}</code>\n`;
    orderMessage += `<b>Payment Method:</b> ${payload.payment_method === 'stars' ? '⭐ Telegram Stars' : '💳 Card Payment'}\n`;
    orderMessage += `<b>Amount:</b> ${total_amount.toLocaleString()} ${payload.payment_method === 'stars' ? 'Stars' : 'UZS'}\n`;
    orderMessage += `<b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Tashkent' })}\n\n`;
    orderMessage += `<b>Order Details:</b>\n`;

    payload.items.forEach(item => {
      orderMessage += `- ${item.name}: ${item.count} x ${item.price.toLocaleString()} = ${(item.count * item.price).toLocaleString()} UZS\n`;
    });

    const userMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(userMessageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat.id,
        text: `<b>✅ To'lov muvaffaqiyatli amalga oshirildi!</b>\n\nBuyurtmangiz qabul qilindi va tez orada tayyorlanadi.\n\n<b>Buyurtma raqami:</b> <code>${telegram_payment_charge_id.slice(-8)}</code>`,
        parse_mode: 'HTML',
      }),
    });

    console.log('Order confirmation sent to user');

  } catch (e) {
    console.error('Error processing successful payment:', e);
  }
}
