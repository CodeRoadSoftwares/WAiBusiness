import {
  getWhatsappClient,
  startWhatsappSession,
} from "./whatsappsession.service.js";
import WhatsappSession from "../whatsappsessions.model.js";

// Keep state in memory
const clientStates = {}; // userId -> "connecting" | "connected" | "failed"

/**
 * Ensure a WhatsApp client is available & ready for this user
 */
export async function ensureWhatsappClient(userId, socket = null) {
  // Already connected
  let client = getWhatsappClient(userId);
  if (client && clientStates[userId] === "connected") {
    return client;
  }

  // Already connecting → wait until done
  if (clientStates[userId] === "connecting") {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        const c = getWhatsappClient(userId);
        if (clientStates[userId] === "connected" && c) {
          clearInterval(check);
          resolve(c);
        }
        if (clientStates[userId] === "failed") {
          clearInterval(check);
          reject(new Error("Client failed to connect"));
        }
      }, 500);
    });
  }

  console.log(
    `♻️ No active client for ${userId}, trying to restore from DB...`
  );

  // Check if session exists in DB
  const sessionDoc = await WhatsappSession.findOne({ userId });
  if (!sessionDoc || !sessionDoc.sessionCreds) {
    throw new Error(
      "No saved WhatsApp session for this user — must pair again."
    );
  }

  // Mark as connecting
  clientStates[userId] = "connecting";

  // Fallback socket (avoids crash if null passed)
  if (!socket) {
    socket = { emit: () => {} };
  }

  try {
    await startWhatsappSession({ userId, socket });

    // Wait for readiness up to 10s
    const startedAt = Date.now();
    while (Date.now() - startedAt < 10_000) {
      client = getWhatsappClient(userId);
      if (client) {
        clientStates[userId] = "connected";
        return client;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    clientStates[userId] = "failed";
    throw new Error("Failed to restore WhatsApp client");
  } catch (err) {
    clientStates[userId] = "failed";
    throw err;
  }
}

/**
 * Helper: Get current client state
 */
export function getClientState(userId) {
  return clientStates[userId] || "disconnected";
}

/**
 * Helper: Mark client as disconnected/failed
 */
export function resetClientState(userId) {
  clientStates[userId] = "disconnected";
}
