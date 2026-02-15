const TelegramBot = require('node-telegram-bot-api');


const token = '7597572171:AAGWWqs1QXK3MdVqwr_EV42igxoxkNkaguI';


const bot = new TelegramBot(token, {polling: true});


const webAppUrl = 'https://smart-food-96ub.vercel.app/';


bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  
  bot.sendMessage(chatId, 'press the button below 👇', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Open App', web_app: { url: webAppUrl } }]
      ]
    }
  });
});


bot.on('polling_error', (error) => {
  console.log('POLLING ERROR:', error.code || error.message);
});

bot.on('webhook_error', (error) => {
  console.log('WEBHOOK ERROR:', error.code || error.message);
});

console.log('Bot is starting...');
console.log(`Using token: ${token.substring(0, 10)}...`);
//done
