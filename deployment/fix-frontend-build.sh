#!/bin/bash
# Fix Frontend Build Issues Script
# This script addresses React/PostCSS/Tailwind compilation problems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_DIR="/var/www/vkswebui"
FRONTEND_DIR="$APP_DIR/frontend"

echo -e "${BLUE}🔧 VKS Frontend Build Fix Script${NC}"
echo "=================================="

# Function to log messages
log_fix() {
    echo -e "${YELLOW}🔧 $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

echo -e "\n${BLUE}📦 Step 1: Complete NPM Reset${NC}"
echo "==============================="

# Remove all node modules and package locks
log_fix "Removing node_modules and package-lock.json..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Clear npm cache completely
log_fix "Clearing npm cache..."
npm cache clean --force

echo -e "\n${BLUE}🔧 Step 2: Fix Package.json Dependencies${NC}"
echo "=========================================="

# Create a backup of package.json
cp package.json package.json.backup

# Fix package.json with compatible versions
log_fix "Updating package.json with compatible versions..."
cat > package.json << 'EOF'
{
  "name": "vks-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1",
    "lucide-react": "^0.263.1",
    "axios": "^1.3.4",
    "web-vitals": "^2.1.4"
  },
  "devDependencies": {
    "tailwindcss": "^3.2.7",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.21"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

echo -e "\n${BLUE}⚙️  Step 3: Fix PostCSS Configuration${NC}"
echo "====================================="

# Create proper PostCSS config
log_fix "Creating PostCSS configuration..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo -e "\n${BLUE}🎨 Step 4: Fix Tailwind Configuration${NC}"
echo "===================================="

# Create proper Tailwind config
log_fix "Creating Tailwind CSS configuration..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

echo -e "\n${BLUE}💄 Step 5: Fix CSS Files${NC}"
echo "========================"

# Fix index.css with proper Tailwind imports
log_fix "Fixing index.css..."
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #fafafa;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

# Simplify App.css to avoid conflicts
log_fix "Simplifying App.css..."
cat > src/App.css << 'EOF'
.App {
  text-align: center;
}

.App-logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .App-logo {
    animation: App-logo-spin infinite 20s linear;
  }
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.App-link {
  color: #61dafb;
}

@keyframes App-logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
EOF

echo -e "\n${BLUE}📦 Step 6: Install Dependencies${NC}"
echo "================================="

# Set npm to use legacy peer deps to avoid conflicts
log_fix "Configuring npm for legacy peer dependencies..."
npm config set legacy-peer-deps true

# Install dependencies with specific Node.js settings
log_fix "Installing dependencies..."
export NODE_OPTIONS="--max_old_space_size=4096"
npm install --no-optional --legacy-peer-deps

echo -e "\n${BLUE}🔧 Step 7: Initialize Tailwind${NC}"
echo "==============================="

# Initialize Tailwind CSS
log_fix "Initializing Tailwind CSS..."
npx tailwindcss init -p --force

echo -e "\n${BLUE}🏗️  Step 8: Build Application${NC}"
echo "============================="

# Set environment variables for build
export NODE_ENV=production
export GENERATE_SOURCEMAP=false
export CI=false

log_fix "Building React application..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Frontend build completed successfully!${NC}"
    echo -e "${GREEN}📁 Build files are in: $FRONTEND_DIR/build${NC}"
    
    # Check build directory
    if [ -d "build" ]; then
        echo -e "${GREEN}📊 Build directory contents:${NC}"
        ls -la build/
        
        # Check build size
        BUILD_SIZE=$(du -sh build/ | cut -f1)
        echo -e "${GREEN}📏 Build size: $BUILD_SIZE${NC}"
    fi
else
    echo -e "\n${RED}❌ Build failed! Checking for issues...${NC}"
    
    echo -e "\n${BLUE}🔍 Troubleshooting Information:${NC}"
    echo "Node.js version: $(node --version)"
    echo "NPM version: $(npm --version)"
    
    echo -e "\n${BLUE}📦 Installed packages:${NC}"
    npm list --depth=0
    
    echo -e "\n${BLUE}🔧 PostCSS plugins check:${NC}"
    npx postcss --version
    npx tailwindcss --help > /dev/null && echo "Tailwind CSS: OK" || echo "Tailwind CSS: ERROR"
    
    exit 1
fi

echo -e "\n${BLUE}🎉 Frontend Build Fix Complete!${NC}"
echo "================================"
echo -e "${GREEN}✅ All steps completed successfully${NC}"
echo -e "${GREEN}🚀 Your React application is ready for deployment${NC}"