#!/bin/bash

# Direct Message API Test Script using curl
# Tests all endpoints of the Direct Message API
# 
# Usage: chmod +x test-api-curl.sh && ./test-api-curl.sh

# Configuration
BASE_URL="http://localhost:4000"
API_KEY="b4a0744d17ecee6f8c40c0b785f19806"
TEST_PHONE="6005434120"
TEST_TEMPLATE_ID="68abd36fdefcc43101808ef3" # Real template ID from database

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper function to make API requests
make_request() {
    local endpoint="$1"
    local method="$2"
    local data="$3"
    local headers="$4"
    
    local url="${BASE_URL}${endpoint}"
    local curl_cmd="curl -s -w '%{http_code}' -X ${method}"
    
    if [ ! -z "$headers" ]; then
        curl_cmd="${curl_cmd} ${headers}"
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="${curl_cmd} -d '${data}'"
    fi
    
    curl_cmd="${curl_cmd} '${url}'"
    
    eval "$curl_cmd"
}

# Test helper function
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    echo -e "\n${BLUE}🧪 Running: ${test_name}${NC}"
    
    if $test_function; then
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED: ${test_name}${NC}"
        ((FAILED++))
    fi
}

# Test 1: Send Text Message
test_send_text_message() {
    local data='{
        "phone": "'${TEST_PHONE}'",
        "type": "text",
        "message": "Hello! This is a test message from the API. 🚀",
        "name": "Test User",
        "priority": "normal"
    }'
    
    local response=$(make_request "/api/messages/m" "POST" "$data" "-H 'X-API-Key: ${API_KEY}' -H 'Content-Type: application/json'")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "202" ]; then
        echo "   Message queued successfully"
        echo "   Response: $body" | jq -r '.data.messageId // "N/A"' | sed 's/^/   Message ID: /'
        return 0
    else
        echo "   HTTP Code: $http_code"
        echo "   Response: $body"
        return 1
    fi
}

# Test 2: Send Media Message
test_send_media_message() {
    local data='{
        "phone": "'${TEST_PHONE}'",
        "type": "media",
        "media": {
            "url": "https://picsum.photos/400/300",
            "type": "image",
            "caption": "Check out this amazing image! 📸",
            "fileName": "test-image.jpg",
            "mimeType": "image/jpeg"
        },
        "name": "Test User",
        "priority": "normal"
    }'
    
    local response=$(make_request "/api/messages/m" "POST" "$data" "-H 'X-API-Key: ${API_KEY}' -H 'Content-Type: application/json'")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "202" ]; then
        echo "   Media message queued successfully"
        echo "   Response: $body" | jq -r '.data.messageId // "N/A"' | sed 's/^/   Message ID: /'
        return 0
    else
        echo "   HTTP Code: $http_code"
        echo "   Response: $body"
        return 1
    fi
}

# Test 3: Send Mixed Message
test_send_mixed_message() {
    local data='{
        "phone": "'${TEST_PHONE}'",
        "type": "mixed",
        "message": "Here is a mixed message with both text and media! 🎉",
        "media": {
            "url": "https://picsum.photos/400/300",
            "type": "image",
            "caption": "Mixed content example",
            "fileName": "mixed-content.jpg",
            "mimeType": "image/jpeg"
        },
        "name": "Test User",
        "priority": "high"
    }'
    
    local response=$(make_request "/api/messages/m" "POST" "$data" "-H 'X-API-Key: ${API_KEY}' -H 'Content-Type: application/json'")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "202" ]; then
        echo "   Mixed message queued successfully"
        echo "   Response: $body" | jq -r '.data.messageId // "N/A"' | sed 's/^/   Message ID: /'
        return 0
    else
        echo "   HTTP Code: $http_code"
        echo "   Response: $body"
        return 1
    fi
}

# Test 4: Send Template Message
test_send_template_message() {
    local data='{
        "templateId": "'${TEST_TEMPLATE_ID}'",
        "variables": {
            "name": "John Doe",
            "company": "Test Company",
            "amount": "$100"
        }
    }'
    
    local response=$(make_request "/api/messages/m/${TEST_PHONE}/t/${TEST_TEMPLATE_ID}" "POST" "$data" "-H 'X-API-Key: ${API_KEY}' -H 'Content-Type: application/json'")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "202" ]; then
        echo "   Template message queued successfully"
        echo "   Response: $body" | jq -r '.data.messageId // "N/A"' | sed 's/^/   Message ID: /'
        return 0
    else
        echo "   HTTP Code: $http_code"
        echo "   Response: $body"
        return 1
    fi
}

# Test 5: Send Bulk Messages
test_send_bulk_messages() {
    local data='{
        "messages": [
            {
                "phone": "'${TEST_PHONE}'",
                "type": "text",
                "message": "Bulk message 1: Hello! 👋",
                "priority": "normal"
            },
            {
                "phone": "'${TEST_PHONE}'",
                "type": "text",
                "message": "Bulk message 2: How are you? 😊",
                "priority": "normal"
            },
            {
                "phone": "'${TEST_PHONE}'",
                "type": "text",
                "message": "Bulk message 3: This is a test! 🧪",
                "priority": "low"
            }
        ]
    }'
    
    local response=$(make_request "/api/messages/m/bulk" "POST" "$data" "-H 'X-API-Key: ${API_KEY}' -H 'Content-Type: application/json'")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "202" ]; then
        echo "   Bulk messages queued successfully"
        echo "   Response: $body" | jq -r '.data.totalProcessed // "N/A"' | sed 's/^/   Processed: /'
        echo "   Response: $body" | jq -r '.data.totalErrors // "N/A"' | sed 's/^/   Errors: /'
        return 0
    else
        echo "   HTTP Code: $http_code"
        echo "   Response: $body"
        return 1
    fi
}

# Test 6: Get Message History
test_get_message_history() {
    local response=$(make_request "/api/messages/m/history?page=1&limit=10" "GET" "" "-H 'X-API-Key: ${API_KEY}'")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "   Message history retrieved successfully"
        echo "   Response: $body" | jq -r '.pagination.total // "N/A"' | sed 's/^/   Total messages: /'
        echo "   Response: $body" | jq -r '.messages | length // "N/A"' | sed 's/^/   Messages returned: /'
        return 0
    else
        echo "   HTTP Code: $http_code"
        echo "   Response: $body"
        return 1
    fi
}

# Test 7: Get Message Statistics
test_get_message_stats() {
    local response=$(make_request "/api/messages/m/stats" "GET" "" "-H 'X-API-Key: ${API_KEY}'")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "   Message statistics retrieved successfully"
        echo "   Response: $body" | jq -r '.stats.total // "N/A"' | sed 's/^/   Total: /'
        echo "   Response: $body" | jq -r '.stats.sent // "N/A"' | sed 's/^/   Sent: /'
        echo "   Response: $body" | jq -r '.stats.failed // "N/A"' | sed 's/^/   Failed: /'
        return 0
    else
        echo "   HTTP Code: $http_code"
        echo "   Response: $body"
        return 1
    fi
}

# Test 8: Test Invalid Authentication
test_invalid_auth() {
    local response=$(make_request "/api/messages/m/history" "GET" "" "-H 'X-API-Key: invalid_key'")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "401" ]; then
        echo "   Correctly rejected invalid API key"
        return 0
    else
        echo "   HTTP Code: $http_code (expected 401)"
        echo "   Response: $body"
        return 1
    fi
}

# Test 9: Test Validation Errors
test_validation_errors() {
    local data='{
        "phone": "invalid_phone",
        "type": "invalid_type",
        "message": "'$(printf 'A%.0s' {1..5000})'"
    }'
    
    local response=$(make_request "/api/messages/m" "POST" "$data" "-H 'X-API-Key: ${API_KEY}' -H 'Content-Type: application/json'")
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "400" ]; then
        echo "   Correctly rejected invalid data"
        echo "   Response: $body" | jq -r '.details | length // "N/A"' | sed 's/^/   Validation errors: /'
        return 0
    else
        echo "   HTTP Code: $http_code (expected 400)"
        echo "   Response: $body"
        return 1
    fi
}

# Test 10: Test Rate Limiting
test_rate_limiting() {
    echo "   Sending multiple requests quickly..."
    
    local success_count=0
    local rate_limited_count=0
    
    for i in {1..5}; do
        local data='{
            "phone": "'${TEST_PHONE}'",
            "type": "text",
            "message": "Rate limit test message '${i}'",
            "priority": "low"
        }'
        
        local response=$(make_request "/api/messages/m" "POST" "$data" "-H 'X-API-Key: ${API_KEY}' -H 'Content-Type: application/json'")
        local http_code="${response: -3}"
        
        if [ "$http_code" = "202" ]; then
            ((success_count++))
        elif [ "$http_code" = "429" ]; then
            ((rate_limited_count++))
        fi
        
        sleep 0.1
    done
    
    echo "   Successful: $success_count"
    echo "   Rate limited: $rate_limited_count"
    
    if [ $success_count -gt 0 ]; then
        return 0
    else
        return 1
    fi
}

# Main execution
echo -e "${YELLOW}🚀 Starting Direct Message API Tests${NC}"
echo "====================================="
echo "Base URL: $BASE_URL"
echo "API Key: ${API_KEY:0:8}..."
echo "Test Phone: $TEST_PHONE"
echo "Template ID: $TEST_TEMPLATE_ID"

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: jq is not installed. Some output formatting may be limited.${NC}"
    echo "   Install jq with: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
fi

# Wait a bit for server to be ready
echo -e "\n⏳ Waiting 2 seconds for server to be ready..."
sleep 2

# Run all tests
run_test "Send Text Message" test_send_text_message
run_test "Send Media Message" test_send_media_message
run_test "Send Mixed Message" test_send_mixed_message
run_test "Send Template Message" test_send_template_message
run_test "Send Bulk Messages" test_send_bulk_messages
run_test "Get Message History" test_get_message_history
run_test "Get Message Statistics" test_get_message_stats
run_test "Test Invalid Authentication" test_invalid_auth
run_test "Test Validation Errors" test_validation_errors
run_test "Test Rate Limiting" test_rate_limiting

# Print results
echo -e "\n${BLUE}📊 Test Results Summary${NC}"
echo "========================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

if [ $((PASSED + FAILED)) -gt 0 ]; then
    local success_rate=$((PASSED * 100 / (PASSED + FAILED)))
    echo -e "${BLUE}📈 Success Rate: ${success_rate}%${NC}"
fi

echo -e "\n${YELLOW}📋 Test Complete${NC}"
echo "=================="

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
