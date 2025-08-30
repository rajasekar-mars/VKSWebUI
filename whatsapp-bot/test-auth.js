const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('Starting simple WhatsApp test...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    }
});

client.on('qr', qr => {
    console.log('\n🔥 NEW QR CODE GENERATED:');
    qrcode.generate(qr, { small: true });
    console.log('\n📱 Scan this QR code with your WhatsApp app!');
    console.log('   1. Open WhatsApp on your phone');
    console.log('   2. Go to Settings > Linked Devices');
    console.log('   3. Tap "Link a Device"');
    console.log('   4. Scan the QR code above\n');
});

client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
    console.log('🎉 Authentication successful!');
    
    // Test sending a message to yourself
    client.getChats().then(chats => {
        console.log(`📋 Found ${chats.length} chats`);
        process.exit(0);
    });
});

client.on('auth_failure', msg => {
    console.error('❌ Authentication failed:', msg);
    process.exit(1);
});

client.on('disconnected', reason => {
    console.log('⚠️  Client disconnected:', reason);
});

console.log('🚀 Initializing WhatsApp client...');
client.initialize();
