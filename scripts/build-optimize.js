#!/usr/bin/env node

/**
 * Build optimization script for Netlify deployment
 * This script runs before the main build to ensure optimal caching and performance
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build optimization...');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 20) {
  console.warn('⚠️  Warning: Node.js version', nodeVersion, 'detected. Node.js 20+ is recommended.');
} else {
  console.log('✅ Node.js version:', nodeVersion, '(compatible)');
}

// Ensure .next directory exists for caching
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  fs.mkdirSync(nextDir, { recursive: true });
  console.log('✅ Created .next directory for caching');
}

// Create cache directory structure
const cacheDir = path.join(nextDir, 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('✅ Created cache directory');
}

// Set environment variables for optimal builds
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Verify critical dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const criticalDeps = ['next', 'react', 'tailwindcss', 'critters'];
const missingDeps = criticalDeps.filter(dep => 
  !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
);

if (missingDeps.length > 0) {
  console.error('❌ Missing critical dependencies:', missingDeps.join(', '));
  process.exit(1);
}

console.log('✅ Build optimization complete!');
console.log('📦 Environment:', process.env.NODE_ENV);
console.log('🔧 Telemetry disabled:', process.env.NEXT_TELEMETRY_DISABLED);
console.log('🎯 Critical dependencies verified');
