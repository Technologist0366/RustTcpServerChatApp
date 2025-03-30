const net = require('net');
const express = require('express');
const app = express();
const http = require('http').createServer(app);

app.use(express.static('public'));
app.use(express.json());

const client = new net.Socket();
let messages = [];

client.connect(8080, '127.0.0.1', () => {
    console.log('Connected to Rust TCP server');
});

client.on('data', (data) => {
    const msg = data.toString().trim();
    messages.push({ text: msg, timestamp: new Date().toLocaleTimeString() });
    console.log('Received: ' + msg);
});

client.on('close', () => {
    console.log('Connection closed');
});

client.on('error', (err) => {
    console.error('Error: ' + err.message);
});

function sendMessage(message) {
    client.write(message + '\n');
}

app.post('/send', (req, res) => {
    const message = req.body.message;
    if (message) {
        sendMessage(message);
        messages.push({ text: message, timestamp: new Date().toLocaleTimeString(), sent: true });
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

app.get('/messages', (req, res) => {
    res.json(messages);
});

http.listen(3000, () => {
    console.log('Frontend server running on http://localhost:3000');
});

module.exports = { sendMessage };