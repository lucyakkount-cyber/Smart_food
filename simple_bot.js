const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual bot token
const token = '7597572171:AAGWWqs1QXK3MdVqwr_EV42igxoxkNkaguI';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// The URL of your web app (placeholder, replace with actual URL)
const webAppUrl = 'https://smartfood-bot-for-xasanboy-web.onrender.com';

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // reply with the button
  bot.sendMessage(chatId, 'press the button below 👇', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Open App', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Log polling errors
bot.on('polling_error', (error) => {
  console.log('POLLING ERROR:', error.code || error.message);
});

bot.on('webhook_error', (error) => {
  console.log('WEBHOOK ERROR:', error.code || error.message);
});

console.log('Bot is starting...');
console.log(`Using token: ${token.substring(0, 10)}...`);
