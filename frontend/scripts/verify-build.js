#!/usr/bin/env node

/**
 * Build verification script
 * Checks for common issues that could cause deployment failures
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build configuration...\n');

const checks = [];

// Check 1: Verify Next.js config exists and has proper static export setup
function checkNextConfig() {
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    return { success: false, message: 'next.config.js not found' };
  }
  
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (!content.includes("output: 'export'")) {
    return { success: false, message: 'Static export not configured in next.config.js' };
  }
  
  if (!content.includes('trailingSlash: true')) {
    return { success: false, message: 'Trailing slash not configured for static export' };
  }
  
  return { success: true, message: 'Next.js configuration is properly set up for static export' };
}

// Check 2: Verify package.json has required scripts
function checkPackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    return { success: false, message: 'package.json not found' };
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!packageJson.scripts?.['build:netlify']) {
    return { success: false, message: 'build:netlify script not found in package.json' };
  }
  
  return { success: true, message: 'Package.json scripts are properly configured' };
}

// Check 3: Verify critical files exist
function checkCriticalFiles() {
  const criticalFiles = [
    'components/ErrorBoundary.tsx',
    'middleware.ts',
    'hooks/useActivity.ts',
    'lib/services/activityApiService.ts',
    'lib/utils/arrayUtils.ts'
  ];
  
  const missing = [];
  
  for (const file of criticalFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    }
  }
  
  if (missing.length > 0) {
    return { 
      success: false, 
      message: `Critical files missing: ${missing.join(', ')}` 
    };
  }
  
  return { success: true, message: 'All critical files are present' };
}

// Check 4: Verify Netlify configuration
function checkNetlifyConfig() {
  const netlifyConfigPath = path.join(__dirname, '..', '..', 'netlify.toml');
  const redirectsPath = path.join(__dirname, '..', 'public', '_redirects');
  
  if (!fs.existsSync(netlifyConfigPath)) {
    return { success: false, message: 'netlify.toml not found' };
  }
  
  if (!fs.existsSync(redirectsPath)) {
    return { success: false, message: '_redirects file not found' };
  }
  
  const netlifyContent = fs.readFileSync(netlifyConfigPath, 'utf8');
  
  // Check for proper MIME type headers
  if (!netlifyContent.includes('application/javascript')) {
    return { 
      success: false, 
      message: 'JavaScript MIME type headers not configured in netlify.toml' 
    };
  }
  
  // Check for build command
  if (!netlifyContent.includes('build:netlify')) {
    return { 
      success: false, 
      message: 'build:netlify command not configured in netlify.toml' 
    };
  }
  
  return { success: true, message: 'Netlify configuration is properly set up' };
}

// Check 5: Verify error handling in critical components
function checkErrorHandling() {
  const useActivityPath = path.join(__dirname, '..', 'hooks', 'useActivity.ts');
  
  if (!fs.existsSync(useActivityPath)) {
    return { success: false, message: 'useActivity hook not found' };
  }
  
  const content = fs.readFileSync(useActivityPath, 'utf8');
  
  if (!content.includes('Array.isArray')) {
    return { 
      success: false, 
      message: 'Array validation not found in useActivity hook' 
    };
  }
  
  return { success: true, message: 'Error handling is properly implemented' };
}

// Run all checks
const allChecks = [
  { name: 'Next.js Configuration', check: checkNextConfig },
  { name: 'Package.json Scripts', check: checkPackageJson },
  { name: 'Critical Files', check: checkCriticalFiles },
  { name: 'Netlify Configuration', check: checkNetlifyConfig },
  { name: 'Error Handling', check: checkErrorHandling }
];

let allPassed = true;

for (const { name, check } of allChecks) {
  const result = check();
  const status = result.success ? '✅' : '❌';
  console.log(`${status} ${name}: ${result.message}`);
  
  if (!result.success) {
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Build should deploy successfully.');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please fix the issues before deploying.');
  process.exit(1);
} 