# Telegram Payment Configuration

## Environment Variables

Add the following to your `.env` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
PAYCOM_PROVIDER_TOKEN=your_paycom_provider_token_here
```

### Test vs Production

**Current Setup (TEST MODE):**

- Paycom Provider Token: `371317599:TEST:1771315701567`
- This is a test token provided by Telegram/Paycom for testing payments
- No real money is charged when using test tokens

**Switching to Production:**

1. Obtain a production provider token from [@BotFather](https://t.me/BotFather)
2. Go to BotFather → Your Bot → Payments
3. Connect your real payment provider
4. Replace the test token with your production token in `.env`

## Webhook Setup

Your bot needs to receive webhook updates for payment processing. Set up the webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.vercel.app/api/webhook" \
  -d "allowed_updates=[\"message\",\"pre_checkout_query\",\"callback_query\"]"
```

**Important:** Make sure `pre_checkout_query` is included in `allowed_updates` to receive payment confirmations.

## Payment Methods

### 1. Telegram Stars (⭐)

- In-app currency
- No provider token needed
- Currency code: `XTR`
- Conversion: ~10,000 UZS = 1 Star (adjust as needed)

### 2. Paycom (💳)

- Traditional card payment
- Requires provider token from payment gateway
- Currency code: `UZS` (Uzbekistan Sum)
- Direct payment in local currency

## Testing Payments

### Test Stars Payment:

1. Add items to cart
2. Click "BUYURTMANI KO'RISH" → "TO'LOV"
3. Select "⭐ Telegram Stars"
4. Complete test payment (no real charge)

### Test Paycom Payment:

1. Add items to cart
2. Click "BUYURTMANI KO'RISH" → "TO'LOV"
3. Select "💳 Karta orqali"
4. Use test card details provided by Paycom
5. Complete test payment

## Troubleshooting

### Invoice not sent

- Check bot token in `.env`
- Verify webhook is properly configured
- Check Vercel function logs

### Payment not processing

- Ensure webhook receives `pre_checkout_query` updates
- Check provider token is correct
- Verify `allowed_updates` includes payment events

### User not receiving confirmation

- Check webhook handler in `/api/webhook.js`
- Verify bot has permission to message user
- Check user's chat ID is correct
