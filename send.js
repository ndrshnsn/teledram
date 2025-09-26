// minimal-bot.js
const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token
const token = '8460124407:AAF8ZRuIKl8V_R2iTMiYu7DgsC2-UV7O9v8';

// Start bot in polling mode
const bot = new TelegramBot(token, { polling: true });

// Log every message
bot.on('message', (msg) => {
    console.log('Received message:', msg.text);
    console.log('From chat ID:', msg.chat.id);

    // Echo back
    bot.sendMessage(msg.chat.id, `You said: ${msg.text}`);
});

console.log('Bot started. Send a message to trigger responses.');