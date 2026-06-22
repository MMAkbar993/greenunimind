#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests frontend deployment and backend integration
 */

const https = require('https');
const http = require('http');

const FRONTEND_URL = 'https://www.greenunimind.com';
const BACKEND_URL = 'https://green-uni-mind-backend-oxpo.onrender.com';

/**
 * Test if a URL is accessible
 */
function testURL(url, description) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Deployment-Verification-Script'
      }
    };

    const req = client.request(options, (res) => {
      resolve({
        success: res.statusCode >= 200 && res.statusCode < 400,
        statusCode: res.statusCode,
        url,
        description
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        url,
        description
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        url,
        description
      });
    });

    req.end();
  });
}

/**
 * Test CORS configuration
 */
function testCORS(origin, backendUrl) {
  return new Promise((resolve) => {
    const url = new URL(backendUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    };

    const req = client.request(options, (res) => {
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-credentials': res.headers['access-control-allow-credentials']
      };

      resolve({
        success: res.statusCode === 200 && corsHeaders['access-control-allow-origin'] === origin,
        statusCode: res.statusCode,
        corsHeaders,
        origin
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        origin
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        origin
      });
    });

    req.end();
  });
}

/**
 * Main verification function
 */
async function runDeploymentVerification() {
  console.log('🔍 Deployment Verification for Green Uni Mind\n');
  
  const tests = [
    // Frontend tests
    { url: FRONTEND_URL, description: 'Frontend Homepage' },
    { url: `${FRONTEND_URL}/login`, description: 'Login Page' },
    { url: `${FRONTEND_URL}/sign-up`, description: 'Sign Up Page' },
    { url: `${FRONTEND_URL}/teacher/dashboard`, description: 'Teacher Dashboard Route' },
    { url: `${FRONTEND_URL}/student/dashboard`, description: 'Student Dashboard Route' },
    
    // Backend tests
    { url: `${BACKEND_URL}/api/v1/health`, description: 'Backend Health Check' },
    { url: `${BACKEND_URL}/api/v1/courses/popular-courses?limit=5`, description: 'Popular Courses API' },
    { url: `${BACKEND_URL}/api/v1/oauth/google?role=student`, description: 'OAuth Endpoint' }
  ];
  
  console.log('📡 Testing URL Accessibility...\n');
  
  for (const test of tests) {
    const result = await testURL(test.url, test.description);
    
    if (result.success) {
      console.log(`✅ ${result.description}: PASSED (${result.statusCode})`);
    } else {
      console.log(`❌ ${result.description}: FAILED`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Error: ${result.error || 'Status ' + result.statusCode}`);
    }
  }
  
  console.log('\n🌐 Testing CORS Configuration...\n');
  
  const corsResult = await testCORS(FRONTEND_URL, `${BACKEND_URL}/api/v1/health`);
  
  if (corsResult.success) {
    console.log('✅ CORS Configuration: PASSED');
    console.log(`   Origin: ${corsResult.origin}`);
    console.log(`   Allow-Origin: ${corsResult.corsHeaders['access-control-allow-origin']}`);
  } else {
    console.log('❌ CORS Configuration: FAILED');
    console.log(`   Origin: ${corsResult.origin}`);
    console.log(`   Error: ${corsResult.error || 'CORS headers missing'}`);
  }
  
  console.log('\n🎯 Deployment Verification Complete!\n');
  
  console.log('📋 Next Steps:');
  console.log('1. If frontend tests fail: Check Hostinger file upload');
  console.log('2. If backend tests fail: Check Render deployment');
  console.log('3. If CORS fails: Verify backend environment variables');
  console.log('4. Test OAuth flow manually in browser');
}

// Run the verification
runDeploymentVerification().catch(console.error);
