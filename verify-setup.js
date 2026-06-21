#!/usr/bin/env node

/**
 * OpGrid Setup Verification Script
 * Checks that all necessary files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

let errors = 0;
let warnings = 0;

console.log('\n🔍 OpGrid Setup Verification\n');

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 18) {
  log.success(`Node.js ${nodeVersion} (>= 18.0.0 required)`);
} else {
  log.error(`Node.js ${nodeVersion} - Please upgrade to 18.0.0 or higher`);
  errors++;
}

// Check project structure
console.log('\n📁 Project Structure:');

const requiredFiles = [
  'schema.sql',
  'README.md',
  'QUICKSTART.md',
  'frontend/package.json',
  'frontend/app/page.tsx',
  'frontend/components/Sidebar.tsx',
  'agent/package.json',
  'agent/src/index.ts',
  'agent/src/scrapers/linkedin.ts',
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    log.success(file);
  } else {
    log.error(`Missing: ${file}`);
    errors++;
  }
});

// Check environment files
console.log('\n🔐 Environment Configuration:');

if (fs.existsSync('frontend/.env.local')) {
  log.success('frontend/.env.local exists');
  
  const content = fs.readFileSync('frontend/.env.local', 'utf-8');
  if (content.includes('your-supabase-url') || content.includes('your-')) {
    log.warn('frontend/.env.local contains placeholder values - update with real credentials');
    warnings++;
  }
} else {
  log.warn('frontend/.env.local not found - copy from .env.example');
  warnings++;
}

if (fs.existsSync('agent/.env')) {
  log.success('agent/.env exists');
  
  const content = fs.readFileSync('agent/.env', 'utf-8');
  if (content.includes('your-') || content.includes('xxxxx')) {
    log.warn('agent/.env contains placeholder values - update with real credentials');
    warnings++;
  }
} else {
  log.warn('agent/.env not found - copy from .env.example');
  warnings++;
}

// Check node_modules
console.log('\n📦 Dependencies:');

if (fs.existsSync('frontend/node_modules')) {
  log.success('Frontend dependencies installed');
} else {
  log.error('Frontend dependencies not installed - run: cd frontend && npm install');
  errors++;
}

if (fs.existsSync('agent/node_modules')) {
  log.success('Agent dependencies installed');
} else {
  log.error('Agent dependencies not installed - run: cd agent && npm install');
  errors++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Summary:`);
console.log(`  ${colors.green}✓ Passed${colors.reset}: ${requiredFiles.length + 2 - errors}`);
if (errors > 0) console.log(`  ${colors.red}✗ Errors${colors.reset}: ${errors}`);
if (warnings > 0) console.log(`  ${colors.yellow}⚠ Warnings${colors.reset}: ${warnings}`);

if (errors === 0 && warnings === 0) {
  console.log(`\n${colors.green}🎉 All checks passed! You're ready to go.${colors.reset}`);
  console.log('\nNext steps:');
  console.log('  1. cd frontend && npm run dev');
  console.log('  2. cd agent && npm run dev');
  console.log('  3. Visit http://localhost:3000\n');
  process.exit(0);
} else if (errors === 0) {
  console.log(`\n${colors.yellow}⚠️  Setup is mostly complete, but please address the warnings above.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}❌ Setup incomplete. Please fix the errors above.${colors.reset}\n`);
  process.exit(1);
}
