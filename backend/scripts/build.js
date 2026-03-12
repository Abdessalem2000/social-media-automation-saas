#!/usr/bin/env node

/**
 * Production Build Script
 * Prepares the application for production deployment
 */

const { execSync } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

const __dirname = path.dirname(__filename);

console.log('🔨 Starting production build process...\n');

// Validate environment
function validateEnvironment() {
  console.log('🔍 Validating production environment...');
  
  const requiredEnvVars = [
    'NODE_ENV',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'MONGODB_URI'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ NODE_ENV must be set to "production"');
    process.exit(1);
  }

  console.log('✅ Environment validation passed\n');
}

// Clean previous build
function cleanBuild() {
  console.log('🧹 Cleaning previous build...');
  
  const buildDir = path.join(__dirname, '../dist');
  
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
  
  console.log('✅ Build directory cleaned\n');
}

// Create production directory structure
function createBuildStructure() {
  console.log('📁 Creating production directory structure...');
  
  const buildDir = path.join(__dirname, '../dist');
  const dirs = [
    'config',
    'controllers',
    'middleware',
    'models',
    'routes',
    'services',
    'utils'
  ];

  fs.mkdirSync(buildDir, { recursive: true });
  
  dirs.forEach(dir => {
    fs.mkdirSync(path.join(buildDir, dir), { recursive: true });
  });

  console.log('✅ Directory structure created\n');
}

// Copy production files
function copyProductionFiles() {
  console.log('📋 Copying production files...');
  
  const buildDir = path.join(__dirname, '../dist');
  const rootDir = path.join(__dirname, '..');
  
  // Files to copy
  const files = [
    'package.json',
    'package-lock.json',
    'server.js',
    '.env.example'
  ];

  // Directories to copy
  const directories = [
    'config',
    'controllers',
    'middleware',
    'models',
    'routes',
    'services',
    'utils'
  ];

  // Copy files
  files.forEach(file => {
    const src = path.join(rootDir, file);
    const dest = path.join(buildDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`   ✓ ${file}`);
    }
  });

  // Copy directories
  directories.forEach(dir => {
    const src = path.join(rootDir, dir);
    const dest = path.join(buildDir, dir);
    
    if (fs.existsSync(src)) {
      copyDirectory(src, dest);
      console.log(`   ✓ ${dir}/`);
    }
  });

  console.log('✅ Production files copied\n');
}

// Copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Optimize package.json for production
function optimizePackageJson() {
  console.log('⚡ Optimizing package.json for production...');
  
  const buildDir = path.join(__dirname, '../dist');
  const packageJsonPath = path.join(buildDir, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Remove development dependencies
    delete packageJson.devDependencies;
    
    // Update scripts for production
    packageJson.scripts = {
      start: 'node server.js',
      health: 'node -e "console.log(require(\'./server.js\')())"'
    };
    
    // Add production metadata
    packageJson.buildInfo = {
      buildTime: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('   ✓ package.json optimized');
  }

  console.log('✅ Package.json optimized\n');
}

// Create production startup script
function createStartupScript() {
  console.log('🚀 Creating production startup script...');
  
  const buildDir = path.join(__dirname, '../dist');
  const startupScript = `#!/bin/bash

# Production Startup Script
echo "🚀 Starting Social Media Automation API..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Validate required environment variables
required_vars=("NODE_ENV" "JWT_ACCESS_SECRET" "JWT_REFRESH_SECRET" "MONGODB_URI")
for var in "\${required_vars[@]}"; do
  if [ -z "\${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  fi
done

echo "✅ Environment validation passed"
echo "🌍 Environment: $NODE_ENV"
echo "📊 Starting server on port: \${PORT:-3001}"

# Start the application
node server.js
`;

  fs.writeFileSync(path.join(buildDir, 'start.sh'), startupScript);
  
  // Make it executable (on Unix systems)
  try {
    execSync('chmod +x start.sh', { cwd: buildDir });
    console.log('   ✓ start.sh created and made executable');
  } catch (_error) {
    console.log('   ✓ start.sh created (chmod not available on this platform)');
  }

  console.log('✅ Startup script created\n');
}

// Create health check script
function createHealthCheckScript() {
  console.log('🏥 Creating health check script...');
  
  const buildDir = path.join(__dirname, '../dist');
  const healthScript = `#!/usr/bin/env node

/**
 * Production Health Check Script
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      if (res.statusCode === 200 && health.success) {
        console.log('✅ Health check passed');
        console.log(\`   Status: \${health.data.status}\`);
        console.log(\`   Uptime: \${Math.floor(health.data.uptime)}s\`);
        console.log(\`   Memory: \${Math.round(health.data.memory.heapUsed / 1024 / 1024)}MB\`);
        process.exit(0);
      } else {
        console.error('❌ Health check failed');
        console.error(\`   Status: \${res.statusCode}\`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Health check response parsing failed');
      console.error(error.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Health check request failed');
  console.error(error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();
`;

  fs.writeFileSync(path.join(buildDir, 'health-check.js'), healthScript);
  console.log('   ✓ health-check.js created');
  console.log('✅ Health check script created\n');
}

// Generate build report
function generateBuildReport() {
  console.log('📊 Generating build report...');
  
  const buildDir = path.join(__dirname, '../dist');
  const report = {
    buildTime: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    files: [],
    directories: []
  };

  // Scan build directory
  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      const itemPath = path.join(dir, item.name);
      const relativeItemPath = path.join(relativePath, item.name);
      
      if (item.isDirectory()) {
        report.directories.push(relativeItemPath);
        scanDirectory(itemPath, relativeItemPath);
      } else {
        const stats = fs.statSync(itemPath);
        report.files.push({
          path: relativeItemPath,
          size: stats.size,
          modified: stats.mtime
        });
      }
    });
  }

  scanDirectory(buildDir);
  
  // Write report
  fs.writeFileSync(
    path.join(buildDir, 'build-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`   ✓ Build report generated`);
  console.log(`   📁 ${report.directories.length} directories`);
  console.log(`   📄 ${report.files.length} files`);
  console.log('✅ Build report generated\n');
}

// Main build process
function build() {
  try {
    validateEnvironment();
    cleanBuild();
    createBuildStructure();
    copyProductionFiles();
    optimizePackageJson();
    createStartupScript();
    createHealthCheckScript();
    generateBuildReport();

    console.log('🎉 Production build completed successfully!');
    console.log('\n📦 Build artifacts are ready in ./dist/');
    console.log('\n🚀 To deploy:');
    console.log('   1. Copy ./dist/ to your production server');
    console.log('   2. Set up environment variables (.env file)');
    console.log('   3. Run: ./start.sh');
    console.log('   4. Health check: node health-check.js');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build
build();

// Export for CommonJS
module.exports = {
  build
};
