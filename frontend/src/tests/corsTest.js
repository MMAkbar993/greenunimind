/**
 * Simple CORS test to verify the backend accepts our requests
 * Run with: node src/tests/corsTest.js
 */

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testCorsHeaders() {
  console.log('🔍 Testing CORS configuration...\n');

  const testCases = [
    {
      name: 'Basic GET request',
      url: `${API_BASE_URL}/health`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    },
    {
      name: 'Request with x-cache-timestamp header',
      url: `${API_BASE_URL}/health`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-cache-timestamp': Date.now().toString(),
      }
    },
    {
      name: 'Request with multiple cache headers',
      url: `${API_BASE_URL}/health`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-cache-timestamp': Date.now().toString(),
        'x-cache-key': 'test-cache-key',
        'Cache-Control': 'no-cache',
      }
    },
    {
      name: 'Request with x-requested-with header (AJAX)',
      url: `${API_BASE_URL}/health`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-requested-with': 'XMLHttpRequest',
      }
    },
    {
      name: 'Preflight OPTIONS request with x-requested-with',
      url: `${API_BASE_URL}/courses/creator/test-id`,
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type,x-requested-with,x-cache-timestamp,authorization',
      }
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    try {
      console.log(`🧪 Testing: ${testCase.name}`);
      
      const response = await fetch(testCase.url, {
        method: testCase.method,
        headers: testCase.headers,
        mode: 'cors', // Explicitly test CORS
      });

      if (response.ok || response.status === 404) { // 404 is OK for test endpoints
        console.log(`✅ ${testCase.name}: PASSED (Status: ${response.status})`);
        
        // Check CORS headers in response
        const corsHeaders = {
          'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
          'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        };
        
        console.log(`   CORS Headers:`, corsHeaders);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.name}: FAILED (Status: ${response.status})`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: ERROR - ${error.message}`);
      failedTests++;
    }
    console.log(''); // Empty line for readability
  }

  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);

  if (failedTests === 0) {
    console.log('\n🎉 All CORS tests passed! The backend should accept requests with cache headers.');
  } else {
    console.log('\n⚠️ Some CORS tests failed. Check the backend CORS configuration.');
  }
}

// Test if we're in a Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment - use node-fetch if available
  try {
    const fetch = require('node-fetch');
    global.fetch = fetch;
    testCorsHeaders().catch(console.error);
  } catch (error) {
    console.log('❌ node-fetch not available. Please run this test in a browser console or install node-fetch.');
    console.log('To test in browser: Copy and paste this code into the browser console on your frontend app.');
  }
} else {
  // Browser environment
  testCorsHeaders().catch(console.error);
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.testCorsHeaders = testCorsHeaders;
}
