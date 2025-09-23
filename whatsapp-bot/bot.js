const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());

let clientReady = false;
let client;
let isInitializing = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const SESSION_DIR = path.join(__dirname, '.wwebjs_auth');

// Function to safely remove directory on Windows
function safeRemoveDir(dirPath, maxRetries = 5, delay = 1000) {
    return new Promise((resolve) => {
        let retries = 0;
        
        function attemptRemove() {
            try {
                if (fs.existsSync(dirPath)) {
                    // On Windows, use rmdir /s /q command as fallback
                    if (process.platform === 'win32') {
                        const child = spawn('cmd', ['/c', 'rmdir', '/s', '/q', `"${dirPath}"`], {
                            stdio: 'ignore',
                            shell: true
                        });
                        
                        child.on('close', (code) => {
                            if (code === 0 || !fs.existsSync(dirPath)) {
                                console.log('Session directory cleaned using Windows rmdir');
                                resolve(true);
                            } else if (retries < maxRetries) {
                                retries++;
                                console.log(`Retrying directory removal... Attempt ${retries}/${maxRetries}`);
                                setTimeout(attemptRemove, delay);
                            } else {
                                console.log('Could not remove session directory after multiple attempts');
                                resolve(false);
                            }
                        });
                        
                        child.on('error', () => {
                            // Fallback to fs.rmSync if cmd fails
                            try {
                                fs.rmSync(dirPath, { recursive: true, force: true });
                                console.log('Session directory cleaned using fs.rmSync');
                                resolve(true);
                            } catch (e) {
                                if (retries < maxRetries) {
                                    retries++;
                                    console.log(`Retrying directory removal... Attempt ${retries}/${maxRetries}`);
                                    setTimeout(attemptRemove, delay);
                                } else {
                                    console.log('Could not remove session directory:', e.message);
                                    resolve(false);
                                }
                            }
                        });
                    } else {
                        // Non-Windows platforms
                        fs.rmSync(dirPath, { recursive: true, force: true });
                        console.log('Session directory cleaned');
                        resolve(true);
                    }
                } else {
                    resolve(true);
                }
            } catch (e) {
                if (retries < maxRetries) {
                    retries++;
                    console.log(`Error removing directory, retrying... Attempt ${retries}/${maxRetries}:`, e.message);
                    setTimeout(attemptRemove, delay);
                } else {
                    console.log('Could not remove session directory after multiple attempts:', e.message);
                    resolve(false);
                }
            }
        }
        
        attemptRemove();
    });
}

function createClient() {
    if (client) {
        try {
            client.destroy();
        } catch (error) {
            console.log('Error destroying previous client:', error.message);
        }
        // Add a small delay to ensure cleanup
        return new Promise(resolve => {
            setTimeout(() => {
                createClientInstance();
                resolve();
            }, 2000);
        });
    } else {
        createClientInstance();
        return Promise.resolve();
    }
}

function createClientInstance() {
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
            console.log('Cleaning up session data safely...');
            
            // Add delay before cleanup to ensure all processes have released file handles
            setTimeout(async () => {
                await safeRemoveDir(SESSION_DIR);
                console.log('Session cleanup completed. Manual restart may be required.');
            }, 5000);
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

async function initializeClient(isRetry = false) {
    if (isInitializing) {
        console.log('Client is already initializing...');
        return;
    }
    
    isInitializing = true;
    console.log('Initializing WhatsApp client...');
    
    if (isRetry) {
        console.log('Attempting to clean session before re-initializing...');
        await safeRemoveDir(SESSION_DIR);
    }

    try {
        await createClient();
        await client.initialize();
        console.log('Client initialized successfully');
    } catch (error) {
        console.error('Error initializing client:', error);
        isInitializing = false;
        clientReady = false;
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Retrying initialization... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
            setTimeout(() => initializeClient(true), 5000); // Retry with cleanup
        } else {
            console.log('Max initialization attempts reached. Manual restart required.');
        }
    }
}

// Start the client
initializeClient();

app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({ error: 'Missing phone or message' });
    }
    
    // Validate phone number format
    const phoneRegex = /^\d{10,15}$/; // Basic validation for 10-15 digits
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ 
            error: 'Invalid phone number format. Please provide 10-15 digits only.',
            received: phone,
            cleaned: cleanPhone
        });
    }
    
    if (!clientReady || !client) {
        return res.status(503).json({ 
            error: 'WhatsApp client not ready. Please try again later.',
            ready: clientReady,
            initializing: isInitializing,
            reconnectAttempts: reconnectAttempts
        });
    }
    
    try {
        console.log(`Attempting to send message to ${cleanPhone}: "${message}"`);
        
        // Add retry logic for send message
        let retries = 3;
        let lastError;
        
        while (retries > 0) {
            try {
                // Check if client is still ready before each attempt
                if (!clientReady || !client) {
                    throw new Error('Client became unavailable during retry');
                }
                
                const chatId = `${cleanPhone}@c.us`;
                console.log(`Sending to chat ID: ${chatId}`);
                
                const result = await client.sendMessage(chatId, message);
                console.log('Message sent successfully:', result);
                
                return res.json({ 
                    success: true, 
                    message: 'Message sent successfully',
                    chatId: chatId,
                    phone: cleanPhone
                });
            } catch (err) {
                lastError = err;
                retries--;
                console.log(`Send attempt failed (${retries} retries left):`, err.message);
                
                if (err.message.includes('Protocol error') || 
                    err.message.includes('Execution context was destroyed') ||
                    err.message.includes('Session closed') ||
                    err.message.includes('Target closed')) {
                    console.log(`Protocol/Session error on send, retrying... (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                } else if (err.message.includes('Chat not found') || 
                          err.message.includes('Phone number is not registered')) {
                    // Don't retry for these errors
                    console.log('Phone number not found on WhatsApp:', cleanPhone);
                    return res.status(404).json({
                        error: 'Phone number not found on WhatsApp',
                        phone: cleanPhone,
                        details: err.message
                    });
                }
                
                // For other errors, wait a bit before retry
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        throw lastError;
        
    } catch (err) {
        console.error('Send error:', err);
        
        // If it's a protocol error, trigger client recreation
        if (err.message.includes('Protocol error') || 
            err.message.includes('Execution context was destroyed') ||
            err.message.includes('Session closed') ||
            err.message.includes('Target closed')) {
            console.log('Critical client error detected, triggering restart...');
            clientReady = false;
            setTimeout(() => {
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    initializeClient(true); // Force cleanup and restart
                }
            }, 2000);
        }
        
        res.status(500).json({ 
            error: 'Failed to send message', 
            details: err.message,
            phone: cleanPhone || phone,
            clientReady: clientReady
        });
    }
});

// Add a test endpoint to check if a phone number is registered on WhatsApp
app.post('/check-number', async (req, res) => {
    const { phone } = req.body;
    
    if (!phone) {
        return res.status(400).json({ error: 'Missing phone number' });
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!clientReady || !client) {
        return res.status(503).json({ 
            error: 'WhatsApp client not ready',
            ready: clientReady,
            initializing: isInitializing
        });
    }
    
    try {
        const chatId = `${cleanPhone}@c.us`;
        const numberInfo = await client.getNumberId(chatId);
        
        if (numberInfo) {
            res.json({
                registered: true,
                phone: cleanPhone,
                chatId: numberInfo._serialized
            });
        } else {
            res.json({
                registered: false,
                phone: cleanPhone
            });
        }
    } catch (err) {
        console.error('Number check error:', err);
        res.status(500).json({
            error: 'Failed to check number',
            details: err.message,
            phone: cleanPhone
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
app.post('/restart', async (req, res) => {
    console.log('Manual restart requested');
    clientReady = false;
    reconnectAttempts = 0;
    
    // Clean session data before restart
    await safeRemoveDir(SESSION_DIR);
    
    initializeClient(true);
    res.json({ message: 'Restart initiated with session cleanup' });
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
    
    // Handle the specific EBUSY error on Windows
    if (reason && reason.message && 
        (reason.message.includes('EBUSY: resource busy or locked') || 
         reason.message.includes('Execution context was destroyed'))) {
        console.log('Caught file lock or context destruction error. Scheduling cleanup and restart.');
        clientReady = false;
        isInitializing = false;
        
        // Don't attempt immediate restart for file lock errors
        if (reason.message.includes('EBUSY')) {
            console.log('File lock detected. Waiting longer before cleanup...');
            setTimeout(async () => {
                await safeRemoveDir(SESSION_DIR);
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    setTimeout(() => initializeClient(true), 10000); // Longer delay for file locks
                }
            }, 10000);
        } else {
            // Context destruction error
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                setTimeout(() => initializeClient(true), 5000);
            }
        }
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    if (client) {
        try {
            await client.destroy();
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 2000));
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
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('Error during shutdown:', error.message);
        }
    }
    process.exit(0);
});
