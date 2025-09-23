const axios = require('axios');

async function testOTP() {
    const baseUrl = 'http://localhost:3001';
    
    try {
        // First check if the bot is ready
        console.log('Checking bot health...');
        const healthResponse = await axios.get(`${baseUrl}/health`);
        console.log('Bot status:', healthResponse.data);
        
        if (!healthResponse.data.status === 'ready') {
            console.log('Bot is not ready yet. Please scan the QR code first.');
            return;
        }
        
        // Test phone number validation
        console.log('\nTesting invalid phone number...');
        try {
            await axios.post(`${baseUrl}/send-message`, {
                phone: 'invalid',
                message: 'Test OTP: 123456'
            });
        } catch (error) {
            console.log('Expected error for invalid phone:', error.response?.data);
        }
        
        // Test with a valid format but fake number
        console.log('\nTesting with valid format but fake number...');
        try {
            const response = await axios.post(`${baseUrl}/send-message`, {
                phone: '1234567890',
                message: 'Test OTP: 123456'
            });
            console.log('Response:', response.data);
        } catch (error) {
            console.log('Error response:', error.response?.data);
        }
        
        // Test number checking endpoint
        console.log('\nTesting number check endpoint...');
        try {
            const checkResponse = await axios.post(`${baseUrl}/check-number`, {
                phone: '1234567890'
            });
            console.log('Number check result:', checkResponse.data);
        } catch (error) {
            console.log('Number check error:', error.response?.data);
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the test
testOTP();