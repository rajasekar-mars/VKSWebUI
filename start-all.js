const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting VKS WebUI Application...\n');

const projectRoot = path.resolve(__dirname);

// Function to start a process
function startProcess(name, command, args, options = {}) {
    console.log(`[${name}] Starting...`);
    
    const process = spawn(command, args, {
        cwd: options.cwd || projectRoot,
        stdio: 'inherit',
        shell: true,
        ...options
    });

    process.on('error', (error) => {
        console.error(`[${name}] Error: ${error.message}`);
    });

    process.on('exit', (code) => {
        console.log(`[${name}] Exited with code ${code}`);
    });

    return process;
}

// Start all services
const services = [];

try {
    // 1. Start Flask Backend
    console.log('\n📊 Starting Flask Backend...');
    const backend = startProcess(
        'Flask Backend',
        'powershell',
        ['-Command', '.\\venv\\Scripts\\Activate.ps1; python backend\\app.py'],
        { cwd: projectRoot }
    );
    services.push(backend);

    // 2. Start WhatsApp Bot
    console.log('\n💬 Starting WhatsApp Bot...');
    const whatsappBot = startProcess(
        'WhatsApp Bot',
        'node',
        ['whatsapp-bot/bot.js'],
        { cwd: projectRoot }
    );
    services.push(whatsappBot);

    // 3. Start React Frontend
    console.log('\n🌐 Starting React Frontend...');
    const frontend = startProcess(
        'React Frontend',
        'npm',
        ['start'],
        { cwd: path.join(projectRoot, 'frontend') }
    );
    services.push(frontend);

    console.log('\n✅ All services started successfully!');
    console.log('\n🌍 Application URLs:');
    console.log('- React Frontend: http://localhost:3000');
    console.log('- Flask Backend: http://localhost:5000');
    console.log('- WhatsApp Bot API: http://localhost:3001');
    console.log('\n💡 Press Ctrl+C to stop all services\n');

} catch (error) {
    console.error('❌ Error starting services:', error.message);
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down all services...');
    services.forEach(service => {
        if (service && !service.killed) {
            service.kill('SIGINT');
        }
    });
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down all services...');
    services.forEach(service => {
        if (service && !service.killed) {
            service.kill('SIGTERM');
        }
    });
    process.exit(0);
});
