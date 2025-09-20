import axios from "axios";

const API_BASE = "http://localhost:8000";
const API_KEY = "test_api_key_123";

async function testDirectMessage() {
  try {
    console.log("🧪 Testing Direct Message API after fix...");

    const response = await axios.post(
      `${API_BASE}/api/messages/m`,
      {
        phone: "6005434120",
        type: "text",
        message: "Test message after fix",
        messageType: "notification",
        priority: "normal",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    console.log("✅ Direct Message Response:", response.data);

    if (response.data.success && response.data.data.messageId) {
      console.log("🎉 Direct message queued successfully!");
      console.log("📋 Message ID:", response.data.data.messageId);

      // Wait a bit and check status
      setTimeout(async () => {
        try {
          const statusResponse = await axios.get(
            `${API_BASE}/api/messages/m/${response.data.data.messageId}/status`,
            {
              headers: {
                "X-API-Key": API_KEY,
              },
            }
          );
          console.log("📊 Message Status:", statusResponse.data);
        } catch (error) {
          console.error(
            "❌ Error checking status:",
            error.response?.data || error.message
          );
        }
      }, 2000);
    }
  } catch (error) {
    console.error("❌ Error testing API:");
    console.error("Error object:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
  }
}

testDirectMessage();
