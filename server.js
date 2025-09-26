const request = require('request');
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http,{
    allowEIO3: true
});

const TelegramBot = require('node-telegram-bot-api');
const token = '';
const https = require('https');
const agent = new https.Agent({ family: 4 });

const subscribers = new Map();
const messageMaps = new Map();

const bot = new TelegramBot(token, {polling: true, request: { agent }});

app.use(express.static('dist', {index: 'demo.html', maxage: '4h'}));
app.use(bodyParser.json());

// handle admin Telegram messages
// bot.on('message', (msg) => {
//     console.log('Received message from', msg.chat.id, ':', msg.text);
//     try {
//         const message = msg.body.message || msg.body.channel_post;
//         const chatId = message.chat.id;
//         const name = message.chat.first_name || message.chat.title || "admin";
//         const text = message.text || "";
//         const reply = message.reply_to_message;

//         if (text.startsWith("/start")) {
//             console.log("/start chatId " + chatId);
//             sendTelegramMessage(chatId,
//                 "*Welcome to Intergram* \n" +
//                 "Your unique chat id is `" + chatId + "`\n" +
//                 "Use it to link between the embedded chat and this telegram chat",
//                 "Markdown");
//         } else if (reply) {
//             let replyText = reply.text || "";
//             let userId = replyText.split(':')[0];
//             io.to(userId).emit(chatId + "-" + userId, {name, text, from: 'admin'});
//         } else if (text){
//             io.emit(chatId, {name, text, from: 'admin'});
//         }

//     } catch (e) {
//         console.error("hook error", e, req.body);
//     }
//     res.statusCode = 200;
//     res.end();
// });


bot.on('channel_post', (msg) => {
    const chatId = msg.chat.id;

    // Only handle replies in private chat
    if (msg.chat.type !== "private") return;
    if (!subscribers.has(chatId)) return;
    if (!msg.reply_to_message) return;

    const { userId } = subscribers.get(chatId);
    const userMap = messageMaps.get(chatId);
    const originalId = userMap?.get(msg.reply_to_message.message_id);

    if (originalId) {
        io.to(userId).emit(`chat-${userId}`, {
            from: "telegram",
            text: msg.text,
            original: msg.reply_to_message.text
        });
    }
});

// handle chat visitors websocket messages
io.on('connection', (socket) => {

    socket.on('register', function(registerMsg){
        const userId = registerMsg.userId; // your internal user ID
        const chatId = "-1002724524938"; // numeric Telegram user ID
        let messageReceived = false;

        if (!subscribers.has(chatId)) {
            subscribers.set(chatId, { userId, socketId: socket.id });
            console.log("Auto-subscribed Telegram user:", chatId);
        }

        socket.on('message', (msg) => {
            console.log("Message from client:", msg.text);
            messageReceived = true;

            // Emit back to socket if needed
            io.to(userId).emit(`chat-${userId}`, msg);

            const visitorName = msg.visitorName ? `[${msg.visitorName}]: ` : "";
            const textToSend = `${userId}: ${visitorName}${msg.text}`;

            bot.sendMessage(chatId, textToSend).then(sent => {
                if (!messageMaps.has(chatId)) messageMaps.set(chatId, new Map());
                // track mapping to handle replies
                messageMaps.get(chatId).set(sent.message_id, sent.message_id);
            });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected for userId ${userId}`);
            if (messageReceived) bot.sendMessage(chatId, `${userId} has left`);

            // Remove subscription
            if (subscribers.has(chatId)) subscribers.delete(chatId);
            if (messageMaps.has(chatId)) messageMaps.delete(chatId);
        });
    });

});

// async function sendTelegramMessage(chatId, text) {
//     bot.sendMessage(chatId, text);
// }

app.post('/usage-start', cors(), function(req, res) {
    console.log('usage from', req.query.host);
    res.statusCode = 200;
    res.end();
});

// left here until the cache expires
app.post('/usage-end', cors(), function(req, res) {
    res.statusCode = 200;
    res.end();
});

http.listen(process.env.PORT || 3000, function(){
    console.log('listening on port:' + (process.env.PORT || 3000));
});

app.get("/.well-known/acme-challenge/:content", (req, res) => {
    res.send(process.env.CERTBOT_RESPONSE);
});
