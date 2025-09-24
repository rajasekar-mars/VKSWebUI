#!/bin/bash
# Quick Frontend Build Fix for PostCSS/Tailwind Issues

cd /var/www/vkswebui/frontend

echo "🔧 Quick fix for PostCSS/Tailwind build issues..."

# 1. Fix PostCSS configuration
echo "Fixing PostCSS config..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 2. Reinstall PostCSS and Tailwind with exact versions
echo "Reinstalling PostCSS and Tailwind..."
npm uninstall tailwindcss autoprefixer postcss
npm install tailwindcss@^3.2.7 autoprefixer@^10.4.14 postcss@^8.4.21 --save-dev

# 3. Set legacy peer deps
npm config set legacy-peer-deps true

# 4. Clear cache and rebuild
echo "Clearing cache and rebuilding..."
npm cache clean --force
export NODE_OPTIONS="--max_old_space_size=4096"
export CI=false

# 5. Try building
echo "Building application..."
npm run build