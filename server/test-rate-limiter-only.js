import { defaultRateLimiter } from "./src/utils/rateLimiter.util.js";

async function testRateLimiter() {
  console.log("🚀 Testing Rate Limiter Fix\n");

  const userId = "test-user-123";

  try {
    // Test 1: First few requests should be allowed
    console.log("📤 Testing first 5 requests...");
    for (let i = 1; i <= 5; i++) {
      const result = await defaultRateLimiter.checkAndConsume(userId, 1);
      console.log(
        `Request ${i}: ${
          result.allowed ? "✅ Allowed" : "❌ Denied"
        } (remaining: ${result.remaining}, waitTime: ${result.waitTime}ms)`
      );
    }

    // Test 2: Send many requests to hit rate limit
    console.log("\n📤 Testing rate limit (sending 20 more requests)...");
    for (let i = 6; i <= 25; i++) {
      const result = await defaultRateLimiter.checkAndConsume(userId, 1);
      console.log(
        `Request ${i}: ${
          result.allowed ? "✅ Allowed" : "❌ Denied"
        } (remaining: ${result.remaining}, waitTime: ${result.waitTime}ms)`
      );

      if (!result.allowed) {
        console.log(
          `⏳ Rate limit hit at request ${i}, waitTime: ${result.waitTime}ms`
        );
        break;
      }
    }

    // Test 3: Check status
    console.log("\n📊 Checking current status...");
    const status = await defaultRateLimiter.getStatus(userId);
    console.log(
      `Current count: ${status.count}, remaining: ${status.remaining}`
    );

    // Test 4: Reset and test again
    console.log("\n🔄 Resetting rate limit...");
    await defaultRateLimiter.reset(userId);

    const statusAfterReset = await defaultRateLimiter.getStatus(userId);
    console.log(
      `After reset - count: ${statusAfterReset.count}, remaining: ${statusAfterReset.remaining}`
    );

    console.log("\n✅ Rate limiter test completed successfully!");
    console.log("🎯 No Redis serialization errors occurred!");
  } catch (error) {
    console.error("❌ Rate limiter test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
testRateLimiter().catch(console.error);
