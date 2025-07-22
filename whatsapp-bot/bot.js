const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

let clientReady = false;
let client;
let isInitializing = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const SESSION_DIR = path.join(__dirname, '.wwebjs_auth');

function createClient() {
    if (client) {
        try {
            client.destroy();
        } catch (error) {
            console.log('Error destroying previous client:', error.message);
        }
    }

    client = new Client({
        authStrategy: new LocalAuth({ dataPath: SESSION_DIR }),
        puppeteer: {
            headless: true,
            // If you're still facing issues, you can try pointing to a locally installed Chrome browser.
            // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-infobars',
                '--window-size=1280,800',
                '--no-default-browser-check',
            ],
        },
        takeoverOnSameUrl: true, // Try to takeover an existing session on the same URL
        takeoverTimeoutMs: 60000, // Increase timeout for takeover
    });

    // Handle authentication failure
    client.on('auth_failure', (msg) => {
        clientReady = false;
        isInitializing = false;
        console.error('AUTHENTICATION FAILURE:', msg);
        setTimeout(() => {
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`Retrying authentication... Attempt ${reconnectAttempts}`);
                initializeClient();
            }
        }, 10000);
    });

    // Handle state changes
    client.on('change_state', (state) => {
        console.log('Client state changed:', state);
    });

    // Handle QR code
    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
        console.log('Scan the QR code above with your WhatsApp app.');
    });

    // Handle ready state
    client.on('ready', () => {
        clientReady = true;
        isInitializing = false;
        reconnectAttempts = 0;
        console.log('WhatsApp bot is ready!');
    });

    // Handle disconnection
    client.on('disconnected', (reason) => {
        clientReady = false;
        isInitializing = false;
        console.log('WhatsApp client disconnected:', reason);
        
        // Don't immediately reconnect on certain reasons
        if (reason === 'LOGOUT' || reason === 'NAVIGATION') {
            console.log('Not auto-reconnecting due to logout or navigation');
            return;
        }

        setTimeout(() => {
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`Attempting to reconnect... Attempt ${reconnectAttempts}`);
                initializeClient();
            } else {
                console.log('Max reconnection attempts reached. Manual restart required.');
            }
        }, 5000);
    });

    // Handle protocol errors
    client.on('error', (error) => {
        console.error('WhatsApp client error:', error);
        clientReady = false;
        isInitializing = false;
        
        if (error.message.includes('Protocol error') || 
            error.message.includes('Execution context was destroyed') ||
            error.message.includes('Target closed')) {
            console.log('Protocol/Context error detected, recreating client...');
            setTimeout(() => {
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    initializeClient();
                }
            }, 3000);
        }
    });

    return client;
}

function initializeClient(isRetry = false) {
    if (isInitializing) {
        console.log('Client is already initializing...');
        return;
    }
    
    isInitializing = true;
    console.log('Initializing WhatsApp client...');
    
    if (isRetry) {
        console.log('Attempting to clean session before re-initializing...');
        try {
            if (fs.existsSync(SESSION_DIR)) {
                fs.rmSync(SESSION_DIR, { recursive: true, force: true });
                console.log('Session directory cleaned.');
            }
        } catch (e) {
            console.error('Error cleaning session directory:', e);
        }
    }

    try {
        createClient();
        client.initialize().catch(err => {
            console.error('Client initialization failed with promise rejection:', err);
            isInitializing = false;
            clientReady = false;
            // This is a critical failure, let's try a full reset.
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                setTimeout(() => initializeClient(true), 5000); // Retry with cleanup
            }
        });
    } catch (error) {
        console.error('Error initializing client:', error);
        isInitializing = false;
        setTimeout(() => {
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                initializeClient();
            }
        }, 5000);
    }
}

// Start the client
initializeClient();

app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({ error: 'Missing phone or message' });
    }
    
    if (!clientReady || !client) {
        return res.status(503).json({ 
            error: 'WhatsApp client not ready. Please try again later.',
            ready: clientReady,
            initializing: isInitializing
        });
    }
    
    try {
        // Add retry logic for send message
        let retries = 3;
        let lastError;
        
        while (retries > 0) {
            try {
                await client.sendMessage(`${phone}@c.us`, message);
                return res.json({ 
                    success: true, 
                    message: 'Message sent successfully' 
                });
            } catch (err) {
                lastError = err;
                retries--;
                
                if (err.message.includes('Protocol error') || 
                    err.message.includes('Execution context was destroyed')) {
                    console.log(`Protocol error on send, retrying... (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                break;
            }
        }
        
        throw lastError;
        
    } catch (err) {
        console.error('Send error:', err);
        
        // If it's a protocol error, trigger client recreation
        if (err.message.includes('Protocol error') || 
            err.message.includes('Execution context was destroyed')) {
            clientReady = false;
            setTimeout(() => {
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    initializeClient();
                }
            }, 2000);
        }
        
        res.status(500).json({ 
            error: 'Failed to send message', 
            details: err.message 
        });
    }
});

// Add health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: clientReady ? 'ready' : 'not_ready',
        initializing: isInitializing,
        reconnectAttempts: reconnectAttempts,
        maxAttempts: MAX_RECONNECT_ATTEMPTS
    });
});

// Add restart endpoint (for manual recovery)
app.post('/restart', (req, res) => {
    console.log('Manual restart requested');
    clientReady = false;
    reconnectAttempts = 0;
    initializeClient();
    res.json({ message: 'Restart initiated' });
});

app.listen(3001, () => {
    console.log('WhatsApp bot API listening on port 3001');
});

// Handle uncaught exceptions to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason && reason.message && reason.message.includes('Execution context was destroyed')) {
        console.log('Caught context destruction error globally. Triggering restart.');
        clientReady = false;
        isInitializing = false;
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(() => initializeClient(true), 5000); // Retry with cleanup
        }
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    if (client) {
        try {
            await client.destroy();
        } catch (error) {
            console.log('Error during shutdown:', error.message);
        }
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    if (client) {
        try {
            await client.destroy();
        } catch (error) {
            console.log('Error during shutdown:', error.message);
        }
    }
    process.exit(0);
});
