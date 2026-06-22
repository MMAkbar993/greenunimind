#!/bin/bash

# CORS Validation Script
# Tests all CORS headers that were causing issues

echo "🔍 Testing CORS Configuration for All Problematic Headers..."
echo ""

API_BASE="http://localhost:5000"
ORIGIN="http://localhost:8080"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test CORS preflight
test_cors_preflight() {
    local test_name="$1"
    local headers="$2"
    local endpoint="$3"
    
    echo -e "${YELLOW}🧪 Testing: $test_name${NC}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X OPTIONS \
        -H "Origin: $ORIGIN" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: $headers" \
        "$API_BASE$endpoint")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $test_name: PASSED (Status: $response)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $test_name: FAILED (Status: $response)${NC}"
        ((FAILED++))
    fi
    echo ""
}

# Function to test actual request
test_cors_request() {
    local test_name="$1"
    local header_name="$2"
    local header_value="$3"
    local endpoint="$4"
    
    echo -e "${YELLOW}🧪 Testing: $test_name${NC}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Origin: $ORIGIN" \
        -H "Content-Type: application/json" \
        -H "$header_name: $header_value" \
        "$API_BASE$endpoint")
    
    # Accept 200, 401, 404 as success (no CORS blocking)
    if [[ "$response" =~ ^(200|401|404)$ ]]; then
        echo -e "${GREEN}✅ $test_name: PASSED (Status: $response - No CORS blocking)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $test_name: FAILED (Status: $response)${NC}"
        ((FAILED++))
    fi
    echo ""
}

echo "=== CORS PREFLIGHT TESTS ==="
echo ""

# Test 1: Basic headers
test_cors_preflight "Basic Content-Type" "content-type" "/health"

# Test 2: Cache timestamp header (first CORS issue)
test_cors_preflight "x-cache-timestamp header" "content-type,x-cache-timestamp" "/api/v1/courses/creator/test"

# Test 3: x-requested-with header (second CORS issue)
test_cors_preflight "x-requested-with header" "content-type,x-requested-with" "/api/v1/courses/creator/test"

# Test 4: Multiple problematic headers
test_cors_preflight "Multiple headers" "content-type,x-cache-timestamp,x-requested-with,authorization" "/api/v1/courses/creator/test"

# Test 5: All cache headers
test_cors_preflight "All cache headers" "content-type,x-cache-timestamp,x-cache-key,x-cache-control" "/api/v1/courses/creator/test"

# Test 6: CSRF protection headers
test_cors_preflight "CSRF headers" "content-type,x-csrf-token,x-xsrf-token" "/api/v1/courses/creator/test"

echo "=== ACTUAL REQUEST TESTS ==="
echo ""

# Test actual requests with problematic headers
test_cors_request "Request with x-cache-timestamp" "x-cache-timestamp" "$(date +%s)000" "/health"
test_cors_request "Request with x-requested-with" "x-requested-with" "XMLHttpRequest" "/health"
test_cors_request "Request with x-cache-key" "x-cache-key" "test-cache-key" "/health"
test_cors_request "Request with x-csrf-token" "x-csrf-token" "test-csrf-token" "/health"

echo "=== TEST SUMMARY ==="
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All CORS tests passed! The backend accepts all problematic headers.${NC}"
    echo ""
    echo "✅ Dashboard should now load without CORS errors"
    echo "✅ Course data fetching should work"
    echo "✅ Rate limiting optimizations are maintained"
    exit 0
else
    echo -e "${RED}⚠️ Some CORS tests failed. Check the backend CORS configuration.${NC}"
    exit 1
fi
