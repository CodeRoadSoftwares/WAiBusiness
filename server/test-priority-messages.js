const axios = require("axios");

const API_BASE = "http://localhost:4000/api/messages";
const API_KEY = "b4a0744d17ecee6f8c40c0b785f19806";

async function testPriorityMessages() {
  console.log("🚀 Testing Priority Message Handling\n");

  const testCases = [
    {
      name: "Urgent Priority Text Message",
      data: {
        phone: "6005434120",
        type: "text",
        message: "URGENT: This is a high priority message!",
        priority: "urgent",
        messageType: "alert",
      },
    },
    {
      name: "High Priority Media Message",
      data: {
        phone: "6005434120",
        type: "media",
        media: "https://picsum.photos/seed/urgent/200/300",
        caption: "High priority image message",
        priority: "high",
        messageType: "alert",
      },
    },
    {
      name: "Normal Priority Message (for comparison)",
      data: {
        phone: "6005434120",
        type: "text",
        message: "This is a normal priority message",
        priority: "normal",
        messageType: "notification",
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📤 Testing: ${testCase.name}`);
    console.log(`Priority: ${testCase.data.priority}`);
    console.log(`Type: ${testCase.data.type}`);

    const startTime = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/m`, testCase.data, {
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json",
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ Response: ${response.status}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Data:`, JSON.stringify(response.data, null, 2));

      // Check if message was queued with correct priority
      if (response.data.success) {
        console.log(`🎯 Message ID: ${response.data.data.messageId}`);
        console.log(`📅 Scheduled for: ${response.data.data.scheduledFor}`);

        // For urgent/high priority, check if delay is 0
        if (
          testCase.data.priority === "urgent" ||
          testCase.data.priority === "high"
        ) {
          const scheduledTime = new Date(response.data.data.scheduledFor);
          const now = new Date();
          const delay = scheduledTime.getTime() - now.getTime();

          if (delay <= 1000) {
            // Allow 1 second tolerance
            console.log(
              `⚡ ✅ High priority message scheduled immediately (${delay}ms delay)`
            );
          } else {
            console.log(
              `⚠️  High priority message has unexpected delay: ${delay}ms`
            );
          }
        }
      }
    } catch (error) {
      console.error(
        `❌ Error: ${error.response?.data?.error || error.message}`
      );
    }

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n🏁 Priority message testing completed!");
}

// Run the test
testPriorityMessages().catch(console.error);
