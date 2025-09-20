#!/usr/bin/env node

/**
 * Direct Message API Test Script
 * Tests all endpoints of the Direct Message API
 *
 * Usage: node test-direct-message-api.js
 */

import fetch from "node-fetch";

// Configuration
const BASE_URL = "http://localhost:4000";
const API_KEY = "b4a0744d17ecee6f8c40c0b785f19806";
const TEST_PHONE = "6005434120";
const TEST_TEMPLATE_ID = "68abd36fdefcc43101808ef3"; // Real template ID from database

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper function to make API requests
async function makeRequest(
  endpoint,
  method = "GET",
  body = null,
  headers = {}
) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  };

  const options = {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data, success: response.ok };
  } catch (error) {
    return { response: null, data: null, success: false, error: error.message };
  }
}

// Test helper function
function runTest(testName, testFunction) {
  return async () => {
    try {
      console.log(`\n🧪 Running: ${testName}`);
      const result = await testFunction();

      if (result.success) {
        console.log(`✅ PASSED: ${testName}`);
        testResults.passed++;
        testResults.tests.push({ name: testName, status: "PASSED", result });
      } else {
        console.log(`❌ FAILED: ${testName}`);
        console.log(`   Error: ${result.error || "Unknown error"}`);
        testResults.failed++;
        testResults.tests.push({ name: testName, status: "FAILED", result });
      }
    } catch (error) {
      console.log(`❌ FAILED: ${testName} - Exception: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({
        name: testName,
        status: "FAILED",
        error: error.message,
      });
    }
  };
}

// Test 1: Send Text Message
const testSendTextMessage = runTest("Send Text Message", async () => {
  const body = {
    phone: TEST_PHONE,
    type: "text",
    message: "Hello! This is a test message from the API. 🚀",
    name: "Test User",
    messageType: "notification",
    priority: "normal",
  };

  const { response, data, success } = await makeRequest(
    "/api/messages/m",
    "POST",
    body
  );

  if (success && data.success) {
    console.log(`   Message ID: ${data.data.messageId}`);
    console.log(`   Status: ${data.data.status}`);
    console.log(`   Rate Limits: ${JSON.stringify(data.data.rateLimits)}`);
    return { success: true, messageId: data.data.messageId, data };
  }

  return { success: false, error: data.error || "Request failed", data };
});

// Test 2: Send Media Message
const testSendMediaMessage = runTest("Send Media Message", async () => {
  const body = {
    phone: TEST_PHONE,
    type: "media",
    media: {
      url: "https://picsum.photos/400/300",
      type: "image",
      caption: "Check out this amazing image! 📸",
      fileName: "test-image.jpg",
      mimeType: "image/jpeg",
    },
    name: "Test User",
    messageType: "promotional",
    priority: "normal",
  };

  const { response, data, success } = await makeRequest(
    "/api/messages/m",
    "POST",
    body
  );

  if (success && data.success) {
    console.log(`   Message ID: ${data.data.messageId}`);
    console.log(`   Status: ${data.data.status}`);
    return { success: true, messageId: data.data.messageId, data };
  }

  return { success: false, error: data.error || "Request failed", data };
});

// Test 3: Send Mixed Message
const testSendMixedMessage = runTest("Send Mixed Message", async () => {
  const body = {
    phone: TEST_PHONE,
    type: "mixed",
    message: "Here's a mixed message with both text and media! 🎉",
    media: {
      url: "https://picsum.photos/400/300",
      type: "image",
      caption: "Mixed content example",
      fileName: "mixed-content.jpg",
      mimeType: "image/jpeg",
    },
    name: "Test User",
    priority: "high",
  };

  const { response, data, success } = await makeRequest(
    "/api/messages/m",
    "POST",
    body
  );

  if (success && data.success) {
    console.log(`   Message ID: ${data.data.messageId}`);
    console.log(`   Status: ${data.data.status}`);
    return { success: true, messageId: data.data.messageId, data };
  }

  return { success: false, error: data.error || "Request failed", data };
});

// Test 4: Send Template Message
const testSendTemplateMessage = runTest("Send Template Message", async () => {
  const body = {
    variables: {
      name: "John Doe",
      company: "Test Company",
      amount: "$100",
    },
    messageType: "transactional",
    priority: "high",
  };

  const { response, data, success } = await makeRequest(
    `/api/messages/m/${TEST_PHONE}/t/${TEST_TEMPLATE_ID}`,
    "POST",
    body
  );

  if (success && data.success) {
    console.log(`   Message ID: ${data.data.messageId}`);
    console.log(`   Status: ${data.data.status}`);
    return { success: true, messageId: data.data.messageId, data };
  }

  return { success: false, error: data.error || "Request failed", data };
});

// Test 5: Send Bulk Messages
const testSendBulkMessages = runTest("Send Bulk Messages", async () => {
  const body = {
    messages: [
      {
        phone: TEST_PHONE,
        type: "text",
        message: "Bulk message 1: Hello! 👋",
        priority: "normal",
      },
      {
        phone: TEST_PHONE,
        type: "text",
        message: "Bulk message 2: How are you? 😊",
        priority: "normal",
      },
      {
        phone: TEST_PHONE,
        type: "text",
        message: "Bulk message 3: This is a test! 🧪",
        priority: "low",
      },
    ],
  };

  const { response, data, success } = await makeRequest(
    "/api/messages/m/bulk",
    "POST",
    body
  );

  if (success && data.success) {
    console.log(`   Processed: ${data.data.totalProcessed} messages`);
    console.log(`   Errors: ${data.data.totalErrors}`);
    console.log(`   Results: ${data.data.results.length} successful`);
    return { success: true, data };
  }

  return { success: false, error: data.error || "Request failed", data };
});

// Test 6: Get Message History
const testGetMessageHistory = runTest("Get Message History", async () => {
  const { response, data, success } = await makeRequest(
    "/api/messages/m/history?page=1&limit=10"
  );

  if (success && data.success) {
    console.log(`   Total messages: ${data.pagination.total}`);
    console.log(`   Messages returned: ${data.messages.length}`);
    console.log(`   Pages: ${data.pagination.pages}`);
    return { success: true, data };
  }

  return { success: false, error: data.error || "Request failed", data };
});

// Test 7: Get Message Statistics
const testGetMessageStats = runTest("Get Message Statistics", async () => {
  const { response, data, success } = await makeRequest(
    "/api/messages/m/stats"
  );

  if (success && data.success) {
    console.log(`   Total: ${data.stats.total}`);
    console.log(`   Sent: ${data.stats.sent}`);
    console.log(`   Failed: ${data.stats.failed}`);
    console.log(`   Pending: ${data.stats.pending}`);
    return { success: true, data };
  }

  return { success: false, error: data.error || "Request failed", data };
});

// Test 7.5: Get Message Statistics by Type
const testGetMessageStatsByType = runTest(
  "Get Message Statistics by Type",
  async () => {
    const { response, data, success } = await makeRequest(
      "/api/messages/m/stats/by-type"
    );

    if (success && data.success) {
      console.log(`   Stats by type: ${JSON.stringify(data.stats, null, 2)}`);
      return { success: true, data };
    }

    return { success: false, error: data.error || "Request failed", data };
  }
);

// Test 8: Get Message Status (using a message ID from previous tests)
let testMessageId = null;
const testGetMessageStatus = runTest("Get Message Status", async () => {
  if (!testMessageId) {
    // First, send a message to get an ID
    const body = {
      phone: TEST_PHONE,
      type: "text",
      message: "Status test message",
      priority: "normal",
    };

    const { data } = await makeRequest("/api/messages/m", "POST", body);
    if (data.success) {
      testMessageId = data.data.messageId;
    } else {
      return { success: false, error: "Could not create test message" };
    }
  }

  const { response, data, success } = await makeRequest(
    `/api/messages/m/${testMessageId}/status`
  );

  if (success && data.success) {
    console.log(`   Message ID: ${data.message.id}`);
    console.log(`   Status: ${data.message.status}`);
    console.log(`   Phone: ${data.message.phone}`);
    console.log(`   Type: ${data.message.type}`);
    return { success: true, data };
  }

  return { success: false, error: data.error || "Request failed", data };
});

// Test 9: Test Authentication (Invalid API Key)
const testInvalidAuth = runTest("Test Invalid Authentication", async () => {
  const { response, data, success } = await makeRequest(
    "/api/messages/m/history",
    "GET",
    null,
    {
      "X-API-Key": "invalid_key",
    }
  );

  // This should fail with 401
  if (!success && response && response.status === 401) {
    console.log(`   Correctly rejected invalid API key`);
    return { success: true, data };
  }

  return { success: false, error: "Should have rejected invalid API key" };
});

// Test 10: Test Rate Limiting
const testRateLimiting = runTest("Test Rate Limiting", async () => {
  console.log("   Sending multiple requests quickly...");

  const promises = [];
  for (let i = 0; i < 5; i++) {
    const body = {
      phone: TEST_PHONE,
      type: "text",
      message: `Rate limit test message ${i + 1}`,
      priority: "low",
    };

    promises.push(makeRequest("/api/messages/m", "POST", body));
  }

  const results = await Promise.all(promises);
  const successful = results.filter((r) => r.success && r.data.success).length;
  const rateLimited = results.filter(
    (r) => !r.success && r.response && r.response.status === 429
  ).length;

  console.log(`   Successful: ${successful}`);
  console.log(`   Rate limited: ${rateLimited}`);

  // At least some should succeed, and some might be rate limited
  if (successful > 0) {
    return { success: true, data: { successful, rateLimited } };
  }

  return { success: false, error: "No requests succeeded" };
});

// Test 11: Test Validation Errors
const testValidationErrors = runTest("Test Validation Errors", async () => {
  const invalidBody = {
    phone: "invalid_phone",
    type: "invalid_type",
    message: "A".repeat(5000), // Too long
  };

  const { response, data, success } = await makeRequest(
    "/api/messages/m",
    "POST",
    invalidBody
  );

  // This should fail with 400
  if (!success && response && response.status === 400) {
    console.log(`   Correctly rejected invalid data`);
    console.log(
      `   Validation errors: ${data.details ? data.details.length : 0}`
    );
    return { success: true, data };
  }

  return { success: false, error: "Should have rejected invalid data" };
});

// Test 12: Test JWT Authentication (if available)
const testJWTAuth = runTest("Test JWT Authentication", async () => {
  // This test assumes you have a JWT token
  // Replace with actual JWT token if available
  const jwtToken = "your_jwt_token_here";

  if (jwtToken === "your_jwt_token_here") {
    console.log("   Skipping JWT test - no token provided");
    return { success: true, data: { skipped: true } };
  }

  const { response, data, success } = await makeRequest(
    "/api/messages/m/history",
    "GET",
    null,
    {
      Authorization: `Bearer ${jwtToken}`,
    }
  );

  if (success && data.success) {
    console.log(`   JWT authentication successful`);
    return { success: true, data };
  }

  return { success: false, error: data.error || "JWT authentication failed" };
});

// Main test runner
async function runAllTests() {
  console.log("🚀 Starting Direct Message API Tests");
  console.log("=====================================");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(`Test Phone: ${TEST_PHONE}`);
  console.log(`Template ID: ${TEST_TEMPLATE_ID}`);

  // Wait a bit for server to be ready
  console.log("\n⏳ Waiting 2 seconds for server to be ready...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Run all tests
  const tests = [
    testSendTextMessage,
    testSendMediaMessage,
    testSendMixedMessage,
    testSendTemplateMessage,
    testSendBulkMessages,
    testGetMessageHistory,
    testGetMessageStats,
    testGetMessageStatsByType,
    testGetMessageStatus,
    testInvalidAuth,
    testRateLimiting,
    testValidationErrors,
    testJWTAuth,
  ];

  for (const test of tests) {
    await test();
    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Print results
  console.log("\n📊 Test Results Summary");
  console.log("========================");
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(
    `📈 Success Rate: ${(
      (testResults.passed / (testResults.passed + testResults.failed)) *
      100
    ).toFixed(1)}%`
  );

  console.log("\n📋 Detailed Results");
  console.log("===================");
  testResults.tests.forEach((test, index) => {
    const status = test.status === "PASSED" ? "✅" : "❌";
    console.log(`${index + 1}. ${status} ${test.name}`);
    if (test.status === "FAILED" && test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Run the tests
runAllTests().catch((error) => {
  console.error("Test runner failed:", error);
  process.exit(1);
});
