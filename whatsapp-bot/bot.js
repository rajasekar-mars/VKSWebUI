
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

let clientReady = false;
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('auth_failure', (msg) => {
    clientReady = false;
    console.error('AUTHENTICATION FAILURE:', msg);
    // Optionally, exit or re-initialize
});

client.on('change_state', (state) => {
    console.log('Client state changed:', state);
});



client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above with your WhatsApp app.');
});


client.on('ready', () => {
    clientReady = true;
    console.log('WhatsApp bot is ready!');
});

client.on('disconnected', (reason) => {
    clientReady = false;
    console.log('WhatsApp client disconnected:', reason);
    // Try to re-initialize after disconnect
    setTimeout(() => {
        client.initialize();
    }, 5000);
});

client.initialize();

app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: 'Missing phone or message' });
    }
    if (!clientReady) {
        return res.status(503).json({ error: 'WhatsApp client not ready. Please try again later.' });
    }
    try {
        await client.sendMessage(`${phone}@c.us`, message);
        res.json({ success: true });
    } catch (err) {
        console.error('Send error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.listen(3000, () => {
    console.log('WhatsApp bot API listening on port 3000');
});
