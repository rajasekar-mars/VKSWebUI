const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above with your WhatsApp app.');
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
});

client.initialize();

app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: 'Missing phone or message' });
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
