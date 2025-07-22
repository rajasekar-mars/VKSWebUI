const fs = require('fs');
const path = require('path');

// Function to clean up authentication and cache files
function cleanupFiles() {
    const authDir = path.join(__dirname, '.wwebjs_auth');
    const cacheDir = path.join(__dirname, '.wwebjs_cache');
    
    try {
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
            console.log('Cleaned up authentication files');
        }
        
        if (fs.existsSync(cacheDir)) {
            fs.rmSync(cacheDir, { recursive: true, force: true });
            console.log('Cleaned up cache files');
        }
        
        console.log('Cleanup completed. You can now restart the bot.');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

// Check if cleanup argument is provided
if (process.argv.includes('--cleanup')) {
    cleanupFiles();
} else {
    console.log('WhatsApp Bot Restart Utility');
    console.log('Usage:');
    console.log('  node restart-bot.js --cleanup   # Clean auth/cache files and restart fresh');
    console.log('');
    console.log('This will remove all authentication data and require QR code scan again.');
}
