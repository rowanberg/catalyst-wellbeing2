#!/usr/bin/env node

/**
 * Build optimization script for Netlify deployment
 * This script runs before the main build to ensure optimal caching and performance
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build optimization...');

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

console.log('✅ Build optimization complete!');
console.log('📦 Environment:', process.env.NODE_ENV);
console.log('🔧 Telemetry disabled:', process.env.NEXT_TELEMETRY_DISABLED);
