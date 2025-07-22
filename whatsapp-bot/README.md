# WhatsApp Bot for VKSWebUI

This WhatsApp bot provides an API endpoint to send messages via WhatsApp Web.

## Features

- **Resilient Error Handling**: Automatically handles Protocol errors and execution context destruction
- **Auto-Reconnection**: Attempts to reconnect up to 5 times with exponential backoff
- **Health Monitoring**: Built-in health check endpoint
- **Manual Recovery**: Restart endpoint for manual recovery
- **Graceful Shutdown**: Proper cleanup on process termination

## API Endpoints

### Send Message
```
POST /send-message
Content-Type: application/json

{
  "phone": "1234567890",
  "message": "Hello from WhatsApp bot!"
}
```

### Health Check
```
GET /health
```
Returns bot status, initialization state, and reconnection attempts.

### Manual Restart
```
POST /restart
```
Manually triggers a bot restart (useful for recovery).

## Running the Bot

1. **Start the bot:**
   ```bash
   node whatsapp-bot/bot.js
   ```

2. **Scan QR Code:**
   - The bot will display a QR code in the terminal
   - Scan it with your WhatsApp mobile app
   - Wait for "WhatsApp bot is ready!" message

3. **Monitor Health:**
   ```bash
   node whatsapp-bot/monitor-bot.js health
   ```

## Troubleshooting

### Protocol Error: "Execution context was destroyed"

This error is now automatically handled by the improved bot. The bot will:
1. Detect the protocol error
2. Automatically recreate the client
3. Attempt reconnection (up to 5 times)
4. Display progress in the console

### Manual Recovery

If the bot becomes unresponsive:

1. **Check health status:**
   ```bash
   node whatsapp-bot/monitor-bot.js health
   ```

2. **Trigger manual restart:**
   ```bash
   curl -X POST http://localhost:3000/restart
   ```

3. **Clean restart (if authentication issues):**
   ```bash
   # Stop the bot first (Ctrl+C)
   node whatsapp-bot/restart-bot.js --cleanup
   # Then restart the bot
   node whatsapp-bot/bot.js
   ```

### Common Issues

1. **Bot not starting:**
   - Ensure port 3000 is not in use
   - Check Node.js version (requires Node.js 14+)
   - Verify dependencies are installed: `npm install`

2. **QR Code not appearing:**
   - Clear authentication files: `node whatsapp-bot/restart-bot.js --cleanup`
   - Restart the bot

3. **Messages not sending:**
   - Check bot health: `node whatsapp-bot/monitor-bot.js health`
   - Verify phone number format (without country code symbols)
   - Ensure WhatsApp Web session is active

4. **Frequent disconnections:**
   - Check internet connection stability
   - Ensure WhatsApp mobile app is connected
   - Consider running bot on a stable server environment

## Files

- `bot.js` - Main bot application
- `monitor-bot.js` - Health monitoring utility
- `restart-bot.js` - Cleanup and restart utility
- `.wwebjs_auth/` - Authentication data (auto-generated)
- `.wwebjs_cache/` - Browser cache (auto-generated)

## Security Notes

- Keep the `.wwebjs_auth` folder secure as it contains session data
- Run the bot in a secure environment
- Consider implementing authentication for the API endpoints in production
- Regularly monitor bot health and logs

## Integration with VKSWebUI

The WhatsApp bot runs independently on port 3000 and can be integrated with the main VKSWebUI application for sending notifications, alerts, or automated messages.
