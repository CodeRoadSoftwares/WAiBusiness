# Direct Message API Test Scripts

This directory contains comprehensive test scripts for the Direct Message API. Choose the script that best fits your environment.

## Available Test Scripts

### 1. `test-api-curl.sh` (Linux/macOS/Git Bash)

**Best for:** Linux, macOS, or Windows with Git Bash/WSL

```bash
# Make executable (Linux/macOS)
chmod +x test-api-curl.sh

# Run the test
./test-api-curl.sh
```

### 2. `test-api-powershell.ps1` (Windows PowerShell)

**Best for:** Windows PowerShell or PowerShell Core

```powershell
# Run the test
.\test-api-powershell.ps1
```

### 3. `test-direct-message-api.js` (Node.js with fetch)

**Best for:** Node.js 18+ with fetch support

```bash
# Install dependencies (if needed)
npm install node-fetch

# Run the test
node test-direct-message-api.js
```

### 4. `test-api-simple.js` (Node.js built-in)

**Best for:** Node.js 18+ with built-in fetch

```bash
# Run the test (no dependencies needed)
node test-api-simple.js
```

## Prerequisites

1. **Server Running**: Make sure your WhatsApp Business server is running on `http://localhost:4000`
2. **API Key**: The test uses API key `b4a0744d17ecee6f8c40c0b785f19806`
3. **Test Phone**: Messages will be sent to `6005434120`
4. **Template ID**: Template messages use `welcome_template` (update if needed)

## Test Coverage

The scripts test all major API endpoints:

### ✅ Message Sending

- **Text Messages**: Simple text content
- **Media Messages**: Images, videos, audio, documents
- **Mixed Messages**: Text + media combination
- **Template Messages**: WhatsApp Business templates
- **Bulk Messages**: Multiple messages in one request

### ✅ Data Retrieval

- **Message History**: Paginated message list with filters
- **Message Statistics**: Success/failure rates and counts
- **Message Status**: Individual message status tracking

### ✅ Security & Validation

- **Authentication**: API key validation
- **Input Validation**: Invalid data rejection
- **Rate Limiting**: Request rate limiting behavior

## Expected Output

```
🚀 Starting Direct Message API Tests
=====================================
Base URL: http://localhost:4000
API Key: b4a0744d...
Test Phone: 6005434120
Template ID: welcome_template

🧪 Running: Send Text Message
✅ PASSED: Send Text Message
   Message ID: 64f8a1b2c3d4e5f6a7b8c9d0
   Status: pending

🧪 Running: Send Media Message
✅ PASSED: Send Media Message
   Message ID: 64f8a1b2c3d4e5f6a7b8c9d1
   Status: pending

...

📊 Test Results Summary
=========================
✅ Passed: 9
❌ Failed: 1
📈 Success Rate: 90.0%

📋 Detailed Results
===================
1. ✅ Send Text Message
2. ✅ Send Media Message
3. ✅ Send Mixed Message
4. ❌ Send Template Message
5. ✅ Send Bulk Messages
6. ✅ Get Message History
7. ✅ Get Message Statistics
8. ✅ Test Invalid Authentication
9. ✅ Test Validation Errors
10. ✅ Test Rate Limiting
```

## Troubleshooting

### Common Issues

1. **Connection Refused**

   - Ensure the server is running on port 4000
   - Check if the server is accessible at `http://localhost:4000`

2. **Authentication Failed**

   - Verify the API key exists in the database
   - Check if the user account is active

3. **Template Not Found**

   - Update `TEST_TEMPLATE_ID` in the script
   - Ensure the template exists in your WhatsApp Business account

4. **Rate Limiting**
   - Some tests may be rate limited - this is expected behavior
   - Wait a few minutes between test runs

### Debug Mode

To see more detailed output, modify the scripts to include verbose logging:

```bash
# For curl script
curl -v -w '%{http_code}' ...

# For Node.js scripts
console.log('Full response:', JSON.stringify(result, null, 2));
```

## Customization

### Change Test Parameters

Edit the configuration section in any script:

```javascript
// Node.js scripts
const API_KEY = "your_api_key_here";
const TEST_PHONE = "your_phone_number";
const TEST_TEMPLATE_ID = "your_template_id";

// Shell/PowerShell scripts
API_KEY = "your_api_key_here";
TEST_PHONE = "your_phone_number";
TEST_TEMPLATE_ID = "your_template_id";
```

### Add New Tests

To add a new test, follow the pattern:

```javascript
// Node.js
const testNewFeature = runTest("Test New Feature", async () => {
  const result = await makeRequest("/api/new-endpoint", "POST", data);
  return { success: result.success, data: result.data };
});
```

```bash
# Shell
test_new_feature() {
  local result=$(make_request "/api/new-endpoint" "POST" "$data" "-H 'X-API-Key: ${API_KEY}'")
  # ... validation logic
}
```

## Performance Testing

For load testing, modify the scripts to:

1. **Increase Request Volume**: Send more messages in bulk tests
2. **Reduce Delays**: Remove sleep statements between requests
3. **Concurrent Requests**: Use Promise.all() for parallel execution
4. **Monitor Metrics**: Track response times and success rates

## Integration with CI/CD

These scripts can be integrated into your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Test Direct Message API
  run: |
    chmod +x test-api-curl.sh
    ./test-api-curl.sh
```

```yaml
# Azure DevOps example
- script: |
    node test-direct-message-api.js
  displayName: "Test Direct Message API"
```

## Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify all dependencies are installed
3. Ensure the database is accessible
4. Check network connectivity between test machine and server

For additional help, refer to the main API documentation at `server/src/whatsapp/messages/DIRECT_MESSAGE_API.md`.
