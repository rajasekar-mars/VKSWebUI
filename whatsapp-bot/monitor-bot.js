const axios = require('axios');

async function checkBotHealth() {
    try {
        const response = await axios.get('http://localhost:3000/health');
        console.log('Bot Health Status:', response.data);
        
        if (response.data.status === 'ready') {
            console.log('✅ WhatsApp bot is ready and operational');
        } else {
            console.log('⚠️ WhatsApp bot is not ready');
            if (response.data.initializing) {
                console.log('🔄 Bot is currently initializing...');
            }
        }
        
        if (response.data.reconnectAttempts > 0) {
            console.log(`🔁 Reconnection attempts: ${response.data.reconnectAttempts}/${response.data.maxAttempts}`);
        }
        
    } catch (error) {
        console.error('❌ Cannot connect to WhatsApp bot:', error.message);
        console.log('Make sure the bot is running on port 3000');
    }
}

async function testSendMessage() {
    try {
        const testPhone = '1234567890'; // Replace with actual test number
        const testMessage = 'Test message from WhatsApp bot';
        
        const response = await axios.post('http://localhost:3000/send-message', {
            phone: testPhone,
            message: testMessage
        });
        
        console.log('✅ Test message send response:', response.data);
    } catch (error) {
        console.error('❌ Test message failed:', error.response ? error.response.data : error.message);
    }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'health') {
    checkBotHealth();
} else if (command === 'test') {
    console.log('Note: Make sure to update the test phone number in the script before running.');
    testSendMessage();
} else {
    console.log('WhatsApp Bot Monitor');
    console.log('Usage:');
    console.log('  node monitor-bot.js health    # Check bot health status');
    console.log('  node monitor-bot.js test      # Send a test message (update phone number first)');
}
