#!/usr/bin/env node

/**
 * Simple Direct Message API Test Script
 * Uses built-in fetch (Node.js 18+) or https module
 *
 * Usage: node test-api-simple.js
 */

import https from "https";
import http from "http";
import { URL } from "url";

// Configuration
const BASE_URL = "http://localhost:4000";
const API_KEY = "b4a0744d17ecee6f8c40c0b785f19806";
const TEST_PHONE = "6005434120";
const TEST_TEMPLATE_ID = "68abd36fdefcc43101808ef3"; // Real template ID from database

// Test results
let passed = 0;
let failed = 0;
const tests = [];

// Helper function to make HTTP requests
function makeRequest(endpoint, method = "GET", body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const defaultHeaders = {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    };

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: { ...defaultHeaders, ...headers },
    };

    const req = (url.protocol === "https:" ? https : http).request(
      options,
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: jsonData,
              success: res.statusCode >= 200 && res.statusCode < 300,
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: data,
              success: false,
              error: "Invalid JSON response",
            });
          }
        });
      }
    );

    req.on("error", (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test helper
async function runTest(testName, testFunction) {
  try {
    console.log(`\n🧪 Running: ${testName}`);
    const result = await testFunction();

    if (result.success) {
      console.log(`✅ PASSED: ${testName}`);
      passed++;
      tests.push({ name: testName, status: "PASSED" });
    } else {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${result.error || "Unknown error"}`);
      failed++;
      tests.push({ name: testName, status: "FAILED", error: result.error });
    }
  } catch (error) {
    console.log(`❌ FAILED: ${testName} - Exception: ${error.message}`);
    failed++;
    tests.push({ name: testName, status: "FAILED", error: error.message });
  }
}

// Test 1: Send Text Message
await runTest("Send Text Message", async () => {
  const body = {
    phone: TEST_PHONE,
    type: "text",
    message: "Hello! This is a test message from the API. 🚀",
    name: "Test User",
    priority: "normal",
  };

  const result = await makeRequest("/api/messages/m", "POST", body);

  if (result.success && result.data.success) {
    console.log(`   Message ID: ${result.data.data.messageId}`);
    console.log(`   Status: ${result.data.data.status}`);
    return { success: true, messageId: result.data.data.messageId };
  }

  return { success: false, error: result.data.error || "Request failed" };
});

// Test 2: Send Media Message
await runTest("Send Media Message", async () => {
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
    priority: "normal",
  };

  const result = await makeRequest("/api/messages/m", "POST", body);

  if (result.success && result.data.success) {
    console.log(`   Message ID: ${result.data.data.messageId}`);
    console.log(`   Status: ${result.data.data.status}`);
    return { success: true, messageId: result.data.data.messageId };
  }

  return { success: false, error: result.data.error || "Request failed" };
});

// Test 3: Send Mixed Message
await runTest("Send Mixed Message", async () => {
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

  const result = await makeRequest("/api/messages/m", "POST", body);

  if (result.success && result.data.success) {
    console.log(`   Message ID: ${result.data.data.messageId}`);
    console.log(`   Status: ${result.data.data.status}`);
    return { success: true, messageId: result.data.data.messageId };
  }

  return { success: false, error: result.data.error || "Request failed" };
});

// Test 4: Send Template Message
await runTest("Send Template Message", async () => {
  const body = {
    templateId: TEST_TEMPLATE_ID,
    variables: {
      name: "John Doe",
      company: "Test Company",
      amount: "$100",
    },
  };

  const result = await makeRequest(
    `/api/messages/m/${TEST_PHONE}/t/${TEST_TEMPLATE_ID}`,
    "POST",
    body
  );

  if (result.success && result.data.success) {
    console.log(`   Message ID: ${result.data.data.messageId}`);
    console.log(`   Status: ${result.data.data.status}`);
    return { success: true, messageId: result.data.data.messageId };
  }

  return { success: false, error: result.data.error || "Request failed" };
});

// Test 5: Send Bulk Messages
await runTest("Send Bulk Messages", async () => {
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

  const result = await makeRequest("/api/messages/m/bulk", "POST", body);

  if (result.success && result.data.success) {
    console.log(`   Processed: ${result.data.data.totalProcessed} messages`);
    console.log(`   Errors: ${result.data.data.totalErrors}`);
    console.log(`   Results: ${result.data.data.results.length} successful`);
    return { success: true };
  }

  return { success: false, error: result.data.error || "Request failed" };
});

// Test 6: Get Message History
await runTest("Get Message History", async () => {
  const result = await makeRequest("/api/messages/m/history?page=1&limit=10");

  if (result.success && result.data.success) {
    console.log(`   Total messages: ${result.data.pagination.total}`);
    console.log(`   Messages returned: ${result.data.messages.length}`);
    console.log(`   Pages: ${result.data.pagination.pages}`);
    return { success: true };
  }

  return { success: false, error: result.data.error || "Request failed" };
});

// Test 7: Get Message Statistics
await runTest("Get Message Statistics", async () => {
  const result = await makeRequest("/api/messages/m/stats");

  if (result.success && result.data.success) {
    console.log(`   Total: ${result.data.stats.total}`);
    console.log(`   Sent: ${result.data.stats.sent}`);
    console.log(`   Failed: ${result.data.stats.failed}`);
    console.log(`   Pending: ${result.data.stats.pending}`);
    return { success: true };
  }

  return { success: false, error: result.data.error || "Request failed" };
});

// Test 8: Test Invalid Authentication
await runTest("Test Invalid Authentication", async () => {
  const result = await makeRequest("/api/messages/m/history", "GET", null, {
    "X-API-Key": "invalid_key",
  });

  // This should fail with 401
  if (!result.success && result.status === 401) {
    console.log(`   Correctly rejected invalid API key`);
    return { success: true };
  }

  return { success: false, error: "Should have rejected invalid API key" };
});

// Test 9: Test Validation Errors
await runTest("Test Validation Errors", async () => {
  const invalidBody = {
    phone: "invalid_phone",
    type: "invalid_type",
    message: "A".repeat(5000), // Too long
  };

  const result = await makeRequest("/api/messages/m", "POST", invalidBody);

  // This should fail with 400
  if (!result.success && result.status === 400) {
    console.log(`   Correctly rejected invalid data`);
    console.log(
      `   Validation errors: ${
        result.data.details ? result.data.details.length : 0
      }`
    );
    return { success: true };
  }

  return { success: false, error: "Should have rejected invalid data" };
});

// Print results
console.log("\n📊 Test Results Summary");
console.log("========================");
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(
  `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
);

console.log("\n📋 Detailed Results");
console.log("===================");
tests.forEach((test, index) => {
  const status = test.status === "PASSED" ? "✅" : "❌";
  console.log(`${index + 1}. ${status} ${test.name}`);
  if (test.status === "FAILED" && test.error) {
    console.log(`   Error: ${test.error}`);
  }
});

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
