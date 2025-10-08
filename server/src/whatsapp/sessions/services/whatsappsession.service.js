import {
  makeWASocket,
  DisconnectReason,
  initAuthCreds,
  BufferJSON,
  fetchLatestBaileysVersion,
} from "baileys";
import WhatsappSession from "../whatsappsessions.model.js";
import QRCode from "qrcode";
import P from "pino";

// Import functions from other services
import { ensureWhatsappClient } from "./ensureWhatsappClient.service.js";
import { warmUpWhatsappSessions } from "./warmUpSessions.service.js";

const clientStates = {}; // userId -> "connecting" | "connected" | "failed"

const activeSessions = new Map();
// Track per-user Bad MAC repair cooldown to avoid restart loops
const badMacRepairState = new Map(); // userId -> { suppressUntil: number, repairing: boolean }
// Suppress noisy WhatsApp decryption errors - these are normal
const logger = P({
  level: "silent", // Completely silent to hide decryption noise
});

// Additional suppression for specific console spam originating from libsignal/Baileys
const noisyPatterns = [
  /Closing stale open session/i,
  /Closing open session/i,
  /Closing session: SessionEntry/i,
  /Failed to decrypt message with any known session/i,
  /Bad MAC/i,
  /<Buffer\s/i,
];

function wrapConsoleSilencer() {
  const origLog = console.log;
  const origError = console.error;
  const shouldSilence = (args) => {
    try {
      const text = args
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
        .join(" ");
      return noisyPatterns.some((re) => re.test(text));
    } catch {
      return false;
    }
  };
  console.log = (...args) => {
    if (shouldSilence(args)) return;
    origLog.apply(console, args);
  };
  console.error = (...args) => {
    if (shouldSilence(args)) return;
    origError.apply(console, args);
  };
}

wrapConsoleSilencer();

// -------- helpers --------

// Avoid showing QR again once we are registered
function shouldShowQR(creds) {
  return !creds?.registered;
}

async function convertQRToBase64(qrString) {
  try {
    const qrDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.92,
      margin: 1,
    });
    return qrDataURL.split(",")[1];
  } catch (error) {
    console.error("❌ QR generation failed:", error.message);
    return null;
  }
}

// -------- Mongo-backed auth state --------
async function getMongoAuthState(userId) {
  // console.log("🔍 Loading auth state for user:", userId);

  // ensure a single doc per user; create one if missing
  let doc = await WhatsappSession.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        sessionCreds: JSON.parse(
          JSON.stringify(initAuthCreds(), BufferJSON.replacer)
        ),
        sessionKeys: JSON.parse(JSON.stringify({}, BufferJSON.replacer)),
        status: "pairing",
        isActive: false,
        lastConnected: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  // ✅ revive Buffers correctly
  let creds = JSON.parse(
    JSON.stringify(doc.sessionCreds || initAuthCreds()),
    BufferJSON.reviver
  );
  let keys = JSON.parse(
    JSON.stringify(doc.sessionKeys || {}),
    BufferJSON.reviver
  );

  // console.log("✅ Loaded sessionCreds from DB");
  // console.log("📱 registered:", !!creds.registered);

  const persist = async ({ saveCreds, saveKeys }) => {
    const update = {};

    if (saveCreds) {
      update.sessionCreds = JSON.parse(
        JSON.stringify(creds, BufferJSON.replacer)
      );
    }
    if (saveKeys) {
      update.sessionKeys = JSON.parse(
        JSON.stringify(keys, BufferJSON.replacer)
      );
    }

    if (Object.keys(update).length) {
      await WhatsappSession.updateOne({ userId }, { $set: update });
      console.log("💾 Updated session in DB");
    }
  };

  const state = {
    creds,
    keys: {
      get: (type, ids) => {
        const data = {};
        for (const id of ids) data[id] = keys?.[type]?.[id];
        return data;
      },
      set: async (data) => {
        for (const [type, typeData] of Object.entries(data)) {
          if (!keys[type]) keys[type] = {};
          Object.assign(keys[type], typeData);
        }
        // Throttled key persistence - save at most once every 30 seconds
        if (!lastKeySave || Date.now() - lastKeySave > 30000) {
          await persist({ saveKeys: true });
          lastKeySave = Date.now();
        }
      },
      clear: async () => {
        keys = {};
        // Always save when clearing keys
        await persist({ saveKeys: true });
        lastKeySave = Date.now();
      },
    },
  };

  const saveCreds = async () => {
    await persist({ saveCreds: true });
  };

  return { state, saveCreds };
}

// Helper function to reset session for a user
async function resetSessionForUser(userId) {
  await WhatsappSession.updateOne(
    { userId },
    {
      $set: {
        sessionCreds: null,
        sessionKeys: {},
        status: "pairing",
        errorReason: "session_reset",
        isActive: true,
        lastConnected: new Date(),
      },
    }
  );
}

// Function to clean up stale connections
export function cleanupStaleConnections() {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes

  for (const [userId, session] of activeSessions.entries()) {
    if (
      !session.ready &&
      session.lastActivity &&
      now - session.lastActivity > staleThreshold
    ) {
      // console.log(`🧹 Cleaning up stale connection for user: ${userId}`);
      try {
        if (session.sock) {
          session.sock.end();
        }
      } catch (error) {
        console.error(
          `Error ending stale connection for user ${userId}:`,
          error
        );
      }
      activeSessions.delete(userId);
      clientStates[userId] = "disconnected";
    }
  }
}

// Start cleanup interval (only if not already started)
if (!global.cleanupIntervalStarted) {
  global.cleanupIntervalStarted = true;
  setInterval(cleanupStaleConnections, 60000); // Run every minute
  console.log("🧹 Started stale connection cleanup interval");
}

// -------- lifecycle --------
export async function startWhatsappSession({ userId, socket }) {
  try {
    // Check if user is already attempting to connect
    if (clientStates[userId] === "connecting") {
      console.log("⏳ User already attempting to connect:", userId);
      return;
    }

    // If a session already exists, just reuse it
    if (activeSessions.has(userId)) {
      const existingSession = activeSessions.get(userId);
      if (existingSession.ready) {
        console.log("🔄 Reusing existing active session for user:", userId);
        return existingSession;
      }
      // If session exists but not ready, clean it up first
      console.log("🧹 Cleaning up incomplete session for user:", userId);
      activeSessions.delete(userId);
    }

    // Check if we've had too many failed attempts for this user
    if (!global.connectionAttempts) global.connectionAttempts = {};
    if (!global.connectionAttempts[userId])
      global.connectionAttempts[userId] = 0;

    if (global.connectionAttempts[userId] >= 3) {
      console.log(
        `❌ Too many connection attempts for user ${userId}, forcing session reset`
      );
      await resetSessionForUser(userId);
      global.connectionAttempts[userId] = 0; // Reset counter

      socket.emit("whatsapp-session-update", {
        status: "pairing",
        errorReason: "max_attempts_reached",
      });
      return;
    }

    const { version } = await fetchLatestBaileysVersion();
    console.log("🚀 Starting WhatsApp session for user:", userId, "v", version);

    const { state, saveCreds } = await getMongoAuthState(userId);

    let isSavingCreds = false;
    let lastKeySave = 0; // Track last key save time for throttling

    const sock = makeWASocket({
      version,
      auth: state,
      browser: ["Chrome (Linux)", "Chrome", "110.0.5481.77"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 120_000, // Increased timeout
      defaultQueryTimeoutMs: 60_000, // Increased query timeout
      keepAliveIntervalMs: 25_000, // Reduced keep alive interval
      logger,
      getMessage: async () => null,
      shouldIgnoreJid: () => false,
      // Add retry logic for connection
      retryRequestDelayMs: 1000,
      maxRetries: 3,
    });

    activeSessions.set(userId, {
      sock,
      ready: false,
      lastActivity: Date.now(),
    });

    // Add connection timeout handler
    const connectionTimeout = setTimeout(() => {
      if (!sock.user) {
        console.log("⏰ Connection timeout for user:", userId);
        sock.end();
      }
    }, 120_000);

    sock.ev.on("creds.update", async (update) => {
      // Store previous state to detect actual changes
      const previousCreds = JSON.stringify(state.creds);
      Object.assign(state.creds, update);

      if (update.me || state.creds?.me) {
        state.creds.registered = true;
        // console.log("🎉 Registration completed for:", state.creds.me);
      }

      // Only save if credentials actually changed
      const currentCreds = JSON.stringify(state.creds);
      if (previousCreds !== currentCreds) {
        // Debounce credential saving to prevent race conditions
        if (!isSavingCreds) {
          isSavingCreds = true;
          try {
            await saveCreds();
          } catch (error) {
            console.error("❌ Error saving credentials:", error);
          } finally {
            isSavingCreds = false;
          }
        }
      }
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && shouldShowQR(state.creds)) {
        console.log("📱 QR code generated, sending to frontend...");
        clientStates[userId] = "connecting";
        const qrBase64 = await convertQRToBase64(qr);
        socket.emit("whatsapp-session-update", {
          status: "pairing",
          qr: qrBase64,
        });
      }

      if (connection === "connecting") {
        clientStates[userId] = "connecting";
        console.log("🔄 Connecting... for user:", userId);
      }

      if (connection === "open") {
        clearTimeout(connectionTimeout);
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

        console.log(`🟢 Connected for user ${userId}: ${phoneNumber}`);

        clientStates[userId] = "connected";

        // Reset connection attempts counter on successful connection
        if (global.connectionAttempts && global.connectionAttempts[userId]) {
          global.connectionAttempts[userId] = 0;
          console.log(
            `✅ Reset connection attempts counter for user ${userId}`
          );
        }

        socket.emit("whatsapp-session-update", {
          status: "connected",
          phoneNumber,
        });

        const session = activeSessions.get(userId);
        if (session) {
          session.ready = true;
          session.lastActivity = Date.now();
        }
      }

      if (connection === "close") {
        clearTimeout(connectionTimeout);
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message;
        console.log(`🔴 Closed [${statusCode}] for user ${userId}`);
        console.log(`📝 Error message: ${errorMessage}`);

        clientStates[userId] = "disconnected";

        // Strategy 1: Handle restart required cases (preserve credentials)
        if (
          statusCode === DisconnectReason.restartRequired ||
          statusCode === 515
        ) {
          console.log("🔁 Restart required — reusing existing creds");
          let tries = 0;
          while (isSavingCreds && tries < 50) {
            await new Promise((r) => setTimeout(r, 100));
            tries++;
          }

          // Clean up current session but preserve credentials
          activeSessions.delete(userId);

          // Restart with delay to prevent rapid reconnection
          setTimeout(() => startWhatsappSession({ userId, socket }), 1000);
          return;
        }

        // Strategy 2: Handle timeout errors (try to recover without reset)
        if (errorMessage === "Timed Out" || errorMessage?.includes("timeout")) {
          console.log("⏰ Timeout detected, attempting recovery...");

          // Wait for any pending credential saves to complete
          let tries = 0;
          while (isSavingCreds && tries < 50) {
            await new Promise((r) => setTimeout(r, 100));
            tries++;
          }

          // Try to recover with existing credentials first
          if (state.creds.registered) {
            console.log("🔄 Attempting recovery with existing credentials...");

            // Clean up current session but preserve credentials
            activeSessions.delete(userId);

            // Attempt recovery with delay
            setTimeout(() => {
              startWhatsappSession({ userId, socket });
            }, 2000);
            return;
          } else {
            console.log("❌ No valid credentials, resetting session");
            await resetSessionForUser(userId);
            socket.emit("whatsapp-session-update", {
              status: "pairing",
              errorReason: "no_credentials",
            });
            return;
          }
        }

        // Strategy 2.5: Handle 401 with specific error messages that indicate device removal
        if (
          statusCode === 401 &&
          (errorMessage === "Connection Failure" ||
            errorMessage?.includes("device_removed") ||
            errorMessage?.includes("conflict"))
        ) {
          console.log(
            "🚫 Device removed from WhatsApp - forcing session reset"
          );

          // Increment connection attempts counter
          if (!global.connectionAttempts) global.connectionAttempts = {};
          if (!global.connectionAttempts[userId])
            global.connectionAttempts[userId] = 0;
          global.connectionAttempts[userId]++;

          // Clean up connection attempts counter since we're resetting
          if (global.connectionAttempts[userId] >= 3) {
            delete global.connectionAttempts[userId];
            console.log(
              `🧹 Cleaned up connection attempts counter for user ${userId} after device removal`
            );
          }

          // Force reset session for device removal
          await resetSessionForUser(userId);

          socket.emit("whatsapp-session-update", {
            status: "pairing",
            errorReason: "device_removed",
          });

          activeSessions.delete(userId);
          return;
        }

        if (statusCode === 401) {
          console.log(
            "🔐 401 — unauthorized; attempting recovery before reset..."
          );

          // Increment connection attempts counter
          if (!global.connectionAttempts) global.connectionAttempts = {};
          if (!global.connectionAttempts[userId])
            global.connectionAttempts[userId] = 0;
          global.connectionAttempts[userId]++;

          // Try to recover first if we have valid credentials
          if (state.creds.registered) {
            console.log("🔄 Attempting recovery with existing credentials...");

            // Clean up current session but preserve credentials
            activeSessions.delete(userId);

            // Attempt recovery with delay
            setTimeout(() => {
              startWhatsappSession({ userId, socket });
            }, 3000);
            return;
          } else {
            console.log(
              "❌ No valid credentials, resetting session for re-pairing"
            );

            // Clear old creds so Baileys will force QR generation next time
            await WhatsappSession.updateOne(
              { userId },
              {
                $set: {
                  sessionCreds: null,
                  sessionKeys: {},
                  status: "pairing", // so frontend knows to show QR
                  errorReason: "unauthorized",
                  isActive: true, // still active, just needs re-pair
                  lastConnected: new Date(),
                },
              }
            );

            // Tell frontend to expect QR again
            socket.emit("whatsapp-session-update", {
              status: "pairing",
              errorReason: "unauthorized",
            });

            // Clean up from active sessions so next start will reload properly
            activeSessions.delete(userId);

            startWhatsappSession({ userId, socket });
            return;
          }
        }

        if (statusCode === 428) {
          console.log(
            "⚠️ 428 — session expired, attempting recovery before reset..."
          );

          // Try to recover first if we have valid credentials
          if (state.creds.registered) {
            console.log("🔄 Attempting recovery with existing credentials...");

            // Clean up current session but preserve credentials
            activeSessions.delete(userId);

            // Attempt recovery with delay
            setTimeout(() => {
              startWhatsappSession({ userId, socket });
            }, 3000);
            return;
          } else {
            console.log("❌ No valid credentials, resetting session...");

            await WhatsappSession.updateOne(
              { userId },
              {
                $set: {
                  sessionCreds: null,
                  sessionKeys: {},
                  status: "pairing",
                  errorReason: "session_expired",
                  isActive: true,
                  lastConnected: new Date(),
                },
              }
            );

            activeSessions.delete(userId);
            socket.emit("whatsapp-session-update", {
              status: "pairing",
              reason: "session_expired",
            });
            startWhatsappSession({ userId, socket });
            return;
          }
        }

        // Strategy 3: Handle logged out case
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        if (isLoggedOut) {
          console.log("🚪 User logged out from WhatsApp app");

          // Clean up connection attempts counter
          if (global.connectionAttempts && global.connectionAttempts[userId]) {
            delete global.connectionAttempts[userId];
            console.log(
              `🧹 Cleaned up connection attempts counter for user ${userId}`
            );
          }

          await WhatsappSession.updateOne(
            { userId },
            {
              $set: {
                status: "disconnected",
                errorReason: "user_logged_out",
                isActive: false,
              },
            }
          );

          socket.emit("whatsapp-session-update", {
            status: "disconnected",
            reason: "user_logged_out",
          });

          activeSessions.delete(userId);
          return;
        }

        // Strategy 4: Handle other errors (try to recover if possible)
        console.log(`⚠️ Unknown error ${statusCode}, attempting recovery...`);

        if (state.creds.registered) {
          console.log("🔄 Attempting recovery with existing credentials...");

          // Clean up current session but preserve credentials
          activeSessions.delete(userId);

          // Attempt recovery with delay
          setTimeout(() => {
            startWhatsappSession({ userId, socket });
          }, 5000);
          return;
        } else {
          console.log("❌ No valid credentials, marking as error");
          await WhatsappSession.updateOne(
            { userId },
            {
              $set: {
                status: "error",
                errorReason: String(statusCode || "unknown"),
                isActive: false,
              },
            }
          );

          socket.emit("whatsapp-session-update", {
            status: "disconnected",
            reason: String(statusCode || "unknown"),
          });

          activeSessions.delete(userId);
        }
      }
    });

    sock.ev.on("error", async (err) => {
      console.error("⚠️ Socket error:", err?.message || err);

      // Only handle critical errors that require connection closure
      if (err?.message === "Timed Out" || err?.message?.includes("timeout")) {
        console.log(
          "⏰ Critical timeout error detected, closing connection..."
        );
        sock.end();
      }

      // Proactive repair for libsignal Bad MAC/decrypt errors
      const msg = String(err?.message || "");
      if (msg.includes("Bad MAC") || msg.includes("Failed to decrypt")) {
        try {
          const now = Date.now();
          const state = badMacRepairState.get(userId) || {
            suppressUntil: 0,
            repairing: false,
          };
          // If we're within cooldown or already repairing, skip to avoid loops
          if (state.repairing || now < state.suppressUntil) {
            return;
          }
          state.repairing = true;
          state.suppressUntil = now + 60_000; // 1 minute cooldown
          badMacRepairState.set(userId, state);

          console.log(
            "🛠️ Detected Bad MAC/decrypt error — refreshing signal sessions (keys only)"
          );
          // Clear only signal sessions/keys to force fresh prekey exchange next send/recv
          // Preserve creds so the device remains paired
          // Reset session keys map
          await WhatsappSession.updateOne(
            { userId },
            {
              $set: {
                sessionKeys: JSON.parse(
                  JSON.stringify({}, BufferJSON.replacer)
                ),
              },
            }
          );
          // End current socket so a new connection reloads fresh keys
          try {
            sock.end();
          } catch {}
          // Restart after short delay
          setTimeout(() => startWhatsappSession({ userId, socket }), 1000);
        } catch (e) {
          console.warn(
            "⚠️ Failed to refresh signal sessions:",
            e?.message || e
          );
        } finally {
          const st = badMacRepairState.get(userId) || {};
          st.repairing = false;
          badMacRepairState.set(userId, st);
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to start session:", error?.message || error);
    try {
      socket.emit("whatsapp-session-update", {
        status: "error",
        error: String(error?.message || error),
      });
    } catch {}

    // Clean up on error
    activeSessions.delete(userId);
  }
}

// Explicit user stop (logout)
export async function stopWhatsappSession(userId) {
  const session = activeSessions.get(userId);
  if (session?.sock) {
    try {
      await session.sock.logout();
      console.log("🚪 Logged out for user:", userId);
    } catch (e) {
      console.warn("⚠️ Logout error:", e?.message || e);
    }
    activeSessions.delete(userId);
  }

  await WhatsappSession.updateOne(
    { userId },
    {
      $set: {
        status: "disconnected",
        errorReason: "user_disconnected",
        sessionCreds: null,
        sessionKeys: {},
        isActive: false,
      },
    }
  );
}

export function getWhatsappSessionStatus(userId) {
  return {
    isActive: activeSessions.has(userId),
    status: activeSessions.has(userId) ? "active" : "inactive",
  };
}

// Return active socket for a given userId
export function getWhatsappClient(userId) {
  const session = activeSessions.get(userId);
  if (session && session.ready) {
    return session.sock;
  }
  return null; // not ready yet
}

export function getClientState(userId) {
  return clientStates[userId] || "unknown";
}

// Export functions from other services
export { ensureWhatsappClient, warmUpWhatsappSessions };
