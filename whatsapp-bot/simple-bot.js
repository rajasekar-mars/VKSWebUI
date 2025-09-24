const express = require('express');
const app = express();

app.use(express.json());

console.log('🚀 Simple WhatsApp Mock Bot Starting...');

// Always successful mock
app.post('/send-message', (req, res) => {
    const { phone, message } = req.body;
    
    console.log('📱 MOCK WhatsApp Message:');
    console.log(`   To: ${phone}`);
    console.log(`   Message: ${message}`);
    console.log('   ✅ Message "sent" successfully!\n');
    
    res.json({
        success: true,
        message: 'Message sent successfully (Mock)',
        phone: phone
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ready',
        initializing: false,
        reconnectAttempts: 0,
        maxAttempts: 5,
        type: 'mock-always-ready'
    });
});

app.listen(3001, () => {
    console.log('✅ Mock WhatsApp Bot ready on http://localhost:3001');
    console.log('   This bot will always work and show OTPs in console');
    console.log('   No QR code scanning needed!\n');
});