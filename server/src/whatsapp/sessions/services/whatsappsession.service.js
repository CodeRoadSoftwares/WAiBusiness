import {
  makeWASocket,
  DisconnectReason,
  initAuthCreds,
  BufferJSON,
} from "baileys";
import WhatsappSession from "../whatsappsessions.model.js";
import QRCode from "qrcode";

// In-memory registry of active sessions
const activeSessions = new Map();

// Stable WhatsApp Web version (DO NOT use fetchLatestBaileysVersion)
// This is compatible with baileys v6+ and avoids 515 errors
const WA_VERSION = [2, 3000, 1023223821];

// MongoDB-backed auth state
async function getMongoAuthState(userId) {
  console.log("🔍 Loading auth state for user:", userId);

  // ✅ Load ANY session for this user (even disconnected), latest first
  let doc = await WhatsappSession.findOne({ userId })
    .sort({ lastConnected: -1 })
    .lean();

  // Only create new if NO session exists
  if (!doc) {
    console.log("📝 Creating new pairing session in DB");
    doc = await WhatsappSession.create({
      userId,
      sessionData: { creds: initAuthCreds(), keys: {} },
      status: "pairing",
      isActive: false,
    });
  }

  let creds;
  const hasValidCreds =
    doc.sessionData?.creds && Object.keys(doc.sessionData.creds).length > 0;

  if (hasValidCreds) {
    console.log("✅ Loading existing creds from DB");
    creds = JSON.parse(
      JSON.stringify(doc.sessionData.creds),
      BufferJSON.reviver
    );
  } else {
    console.log("🆕 Initializing fresh creds");
    creds = initAuthCreds();
  }

  let keys = doc.sessionData.keys || {};

  const persist = async ({ creds: saveCreds, keys: saveKeys }) => {
    try {
      const update = {};

      if (saveCreds) {
        // ✅ CORRECT: Use JSON.stringify with BufferJSON.replacer
        update["sessionData.creds"] = JSON.parse(
          JSON.stringify(creds, BufferJSON.replacer)
        );
      }

      if (saveKeys) {
        for (const [cat, ids] of Object.entries(saveKeys)) {
          for (const [id, value] of Object.entries(ids)) {
            // ✅ CORRECT: Serialize each value with replacer
            update[`sessionData.keys.${cat}.${id}`] = JSON.parse(
              JSON.stringify(value, BufferJSON.replacer)
            );
          }
        }
      }

      if (Object.keys(update).length) {
        await WhatsappSession.updateOne({ userId }, { $set: update });
      }
    } catch (err) {
      console.error("❌ Failed to persist auth state:", err.message);
    }
  };

  const state = {
    creds,
    keys: {
      get: (type, ids) => {
        const data = {};
        ids.forEach((id) => (data[id] = keys[type]?.[id]));
        return data;
      },
      set: async (data) => {
        for (const [type, typeData] of Object.entries(data)) {
          keys[type] = { ...(keys[type] || {}), ...typeData };
        }
        await persist({ keys: data });
      },
      clear: async () => {
        keys = {};
        await persist({ keys: true });
      },
    },
  };

  return {
    state,
    saveCreds: () => persist({ creds: true }),
  };
}

// Convert QR string to base64 PNG
async function convertQRToBase64(qrString) {
  try {
    const qrDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.92,
      margin: 1,
    });
    const base64Data = qrDataURL.split(",")[1];
    return base64Data;
  } catch (error) {
    console.error("❌ QR generation failed:", error.message);
    return null;
  }
}

/**
 * Start WhatsApp session for a user
 */
export async function startWhatsappSession({ userId, socket }) {
  try {
    // Stop any existing session
    if (activeSessions.has(userId)) {
      console.log("⚠️ Active session found, stopping before restart...");
      await stopWhatsappSession(userId);
    }

    console.log("🚀 Starting WhatsApp session for user:", userId);

    const { state, saveCreds } = await getMongoAuthState(userId);

    const sock = makeWASocket({
      version: WA_VERSION,
      auth: state,
      browser: ["Chrome (Linux)", "Chrome", "110.0.5481.77"], // Desktop-like
      syncFullHistory: true, // Enable for desktop mode
      markOnlineOnConnect: true,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 30_000,
      keepAliveIntervalMs: 30_000,
      getMessage: async (key) => {
        // Not storing messages yet — return null
        return null;
      },
    });

    // Store before event handlers
    activeSessions.set(userId, sock);

    // Handle credential updates
    sock.ev.on("creds.update", async (update) => {
      Object.assign(state.creds, update);

      // ✅ CRITICAL: Mark as registered after pairing
      if (update.me) {
        state.creds.registered = true;
        console.log("✅ Session marked as registered");
      }

      await saveCreds();
    });

    // Connection events
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR Code
      if (qr) {
        console.log("📱 QR code generated, sending to frontend...");
        const qrBase64 = await convertQRToBase64(qr);
        socket.emit("whatsapp-session-update", {
          status: "pairing",
          qr: qrBase64,
        });
      }

      // Connected
      if (connection === "open") {
        const me = sock.user;
        const phoneNumber = me?.id?.split(":")?.[0];

        await WhatsappSession.updateOne(
          { userId },
          {
            $set: {
              status: "connected",
              phoneNumber,
              lastConnected: new Date(),
              errorReason: null,
              isActive: true,
            },
          }
        );

        console.log(`🟢 WhatsApp connected for user ${userId}: ${phoneNumber}`);
        socket.emit("whatsapp-session-update", {
          status: "connected",
          phoneNumber,
        });
      }

      // Disconnected
      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`🔴 Connection closed [${statusCode}] for user ${userId}`);

        // Handle restart (after QR scan)
        if (statusCode === DisconnectReason.restartRequired) {
          console.log("🔁 Restart required — reconnecting...");
          setTimeout(() => {
            startWhatsappSession({ userId, socket }).catch(console.error);
          }, 3000);
          return;
        }

        // 👇 DO NOT CLEAR CREDS ON 515!
        if (statusCode === 515) {
          console.log(
            "🧨 515 error — DO NOT CLEAR CREDS, let restart reuse them"
          );

          await WhatsappSession.updateOne(
            { userId },
            {
              $set: {
                status: "error",
                errorReason: "515 bad-session",
                isActive: false,
              },
            }
          );
        } else {
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          await WhatsappSession.updateOne(
            { userId },
            {
              $set: {
                status: isLoggedOut ? "disconnected" : "error",
                errorReason: String(statusCode || "unknown"),
                isActive: false,
              },
            }
          );
        }

        socket.emit("whatsapp-session-update", {
          status: "disconnected",
          reason: String(statusCode || "unknown"),
        });

        activeSessions.delete(userId);
      }
    });

    // Error events (non-fatal)
    sock.ev.on("error", (err) => {
      console.error("⚠️ Socket error:", err.message);
    });
  } catch (error) {
    console.error("❌ Failed to start WhatsApp session:", error.message);
    socket.emit("whatsapp-session-update", {
      status: "error",
      error: error.message,
    });
  }
}

/**
 * Stop WhatsApp session
 */
export async function stopWhatsappSession(userId) {
  const sock = activeSessions.get(userId);
  if (sock) {
    try {
      await sock.logout(); // Proper logout
      console.log("🚪 Logged out WhatsApp session for user:", userId);
    } catch (e) {
      console.warn("⚠️ Error during logout:", e.message);
    }
    activeSessions.delete(userId);
  }

  await WhatsappSession.updateOne(
    { userId },
    {
      $set: {
        status: "disconnected",
        errorReason: "user_disconnected",
        isActive: false,
      },
    }
  );
}

/**
 * Get session status
 */
export function getWhatsappSessionStatus(userId) {
  return {
    isActive: activeSessions.has(userId),
    status: activeSessions.has(userId) ? "active" : "inactive",
  };
}
