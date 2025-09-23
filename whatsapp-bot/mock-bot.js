const express = require('express');
const app = express();

app.use(express.json());

// Mock WhatsApp bot for testing OTP functionality
app.post('/send-message', (req, res) => {
    const { phone, message } = req.body;
    
    console.log(`[MOCK] Would send to ${phone}: ${message}`);
    
    // Simulate successful message sending
    res.json({
        success: true,
        message: 'Message sent successfully (MOCK)',
        phone: phone
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ready',
        initializing: false,
        reconnectAttempts: 0,
        maxAttempts: 5,
        type: 'mock'
    });
});

app.listen(3001, () => {
    console.log('Mock WhatsApp bot API listening on port 3001');
    console.log('This is a mock service for testing OTP functionality');
});