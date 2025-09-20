import axios from "axios";

const API_BASE = "http://localhost:4000/api";
const API_KEY = "b4a0744d17ecee6f8c40c0b785f19806";

async function testRateLimitFix() {
  console.log("🚀 Testing Rate Limit Fix\n");

  // Send multiple messages rapidly to trigger rate limiting
  const messages = [
    "Message 1 - Should be sent immediately",
    "Message 2 - Should be sent immediately",
    "Message 3 - Should be sent immediately",
    "Message 4 - Should be sent immediately",
    "Message 5 - Should be sent immediately",
    "Message 6 - Should be sent immediately",
    "Message 7 - Should be sent immediately",
    "Message 8 - Should be sent immediately",
    "Message 9 - Should be sent immediately",
    "Message 10 - Should be sent immediately",
    "Message 11 - Should be sent immediately",
    "Message 12 - Should be sent immediately",
    "Message 13 - Should be sent immediately",
    "Message 14 - Should be sent immediately",
    "Message 15 - Should be sent immediately",
    "Message 16 - Should be sent immediately",
    "Message 17 - Should be sent immediately",
    "Message 18 - Should be sent immediately",
    "Message 19 - Should be sent immediately",
    "Message 20 - Should be sent immediately",
    "Message 21 - Should be requeued (rate limit hit)",
    "Message 22 - Should be requeued (rate limit hit)",
    "Message 23 - Should be requeued (rate limit hit)",
    "Message 24 - Should be requeued (rate limit hit)",
    "Message 25 - Should be requeued (rate limit hit)",
  ];

  console.log(
    `📤 Sending ${messages.length} messages rapidly to test rate limiting...\n`
  );

  const results = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log(`\n📤 Message ${i + 1}: "${message}"`);

    const startTime = Date.now();

    try {
      const response = await axios.post(
        `${API_BASE}/messages/m`,
        {
          phone: "6005434120",
          type: "text",
          message: message,
          priority: "high",
          messageType: "alert",
        },
        {
          headers: {
            "X-API-Key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ Response: ${response.status} (${duration}ms)`);

      if (response.data.success) {
        console.log(`🎯 Message ID: ${response.data.data.messageId}`);
        console.log(`📅 Scheduled for: ${response.data.data.scheduledFor}`);

        if (response.data.data.extendedOnline) {
          console.log(`🔄 ✅ Presence extended (user was already online)`);
        } else if (response.data.data.presenceUsed) {
          console.log(`🎭 ✅ Full presence sequence used (user went online)`);
        }

        results.push({
          message: i + 1,
          status: "queued",
          duration: duration,
          messageId: response.data.data.messageId,
        });
      } else {
        console.error(`❌ Failed to queue message: ${response.data.error}`);
        results.push({
          message: i + 1,
          status: "failed",
          duration: duration,
          error: response.data.error,
        });
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(
        `❌ Network error (${duration}ms): ${
          error.response?.data?.error || error.message
        }`
      );
      results.push({
        message: i + 1,
        status: "error",
        duration: duration,
        error: error.response?.data?.error || error.message,
      });
    }

    // Very short delay between requests to trigger rate limiting quickly
    if (i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));

  const queued = results.filter((r) => r.status === "queued").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log(`✅ Queued: ${queued}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`💥 Errors: ${errors}`);

  console.log("\n📈 Expected Behavior:");
  console.log(
    "• First 20 messages: Should be queued immediately (rate limit: 20/min)"
  );
  console.log("• Messages 21+: Should be requeued with delay (rate limit hit)");
  console.log("• No Redis serialization errors");
  console.log("• Messages should eventually be processed after delay");

  console.log(
    "\n⏳ Waiting 30 seconds to see if requeued messages are processed..."
  );
  await new Promise((resolve) => setTimeout(resolve, 30000));

  console.log("\n🏁 Rate limit fix test completed!");
}

// Run the test
testRateLimitFix().catch(console.error);
