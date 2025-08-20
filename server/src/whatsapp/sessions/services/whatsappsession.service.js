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

const activeSessions = new Map();
const logger = P({ level: "warn" });

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
  console.log("🔍 Loading auth state for user:", userId);

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

  console.log("✅ Loaded sessionCreds from DB");
  console.log("📱 registered:", !!creds.registered);

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
        await persist({ saveKeys: true });
      },
      clear: async () => {
        keys = {};
        await persist({ saveKeys: true });
      },
    },
  };

  const saveCreds = async () => {
    await persist({ saveCreds: true });
  };

  return { state, saveCreds };
}

// -------- lifecycle --------
export async function startWhatsappSession({ userId, socket }) {
  try {
    if (activeSessions.has(userId)) {
      try {
        activeSessions.get(userId).end(new Error("restarting"));
      } catch {}
      activeSessions.delete(userId);
    }

    const { version } = await fetchLatestBaileysVersion();
    console.log("🚀 Starting WhatsApp session for user:", userId, "v", version);

    const { state, saveCreds } = await getMongoAuthState(userId);

    let isSavingCreds = false;

    const sock = makeWASocket({
      version,
      auth: state,
      browser: ["Chrome (Linux)", "Chrome", "110.0.5481.77"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 30_000,
      keepAliveIntervalMs: 30_000,
      logger,
      getMessage: async () => null,
      shouldIgnoreJid: () => false,
    });

    activeSessions.set(userId, sock);

    sock.ev.on("creds.update", async (update) => {
      console.log("🔐 creds.update:", Object.keys(update));
      Object.assign(state.creds, update);

      if (update.me || state.creds?.me) {
        state.creds.registered = true;
        console.log("🎉 Registration completed for:", state.creds.me);
      }

      isSavingCreds = true;
      await saveCreds();
      isSavingCreds = false;
      console.log(
        "✅ saveCreds() completed (registered:",
        !!state.creds.registered,
        ")"
      );
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && shouldShowQR(state.creds)) {
        console.log("📱 QR code generated, sending to frontend...");
        const qrBase64 = await convertQRToBase64(qr);
        socket.emit("whatsapp-session-update", {
          status: "pairing",
          qr: qrBase64,
        });
      }

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

        console.log(`🟢 Connected for user ${userId}: ${phoneNumber}`);
        socket.emit("whatsapp-session-update", {
          status: "connected",
          phoneNumber,
        });
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`🔴 Closed [${statusCode}] for user ${userId}`);

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
          setTimeout(() => startWhatsappSession({ userId, socket }), 500);
          return;
        }

        if (statusCode === 401) {
          console.log(
            "🔐 401 — unauthorized; resetting session for re-pairing"
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

        socket.emit("whatsapp-session-update", {
          status: "disconnected",
          reason: String(statusCode || "unknown"),
        });

        activeSessions.delete(userId);
      }
    });

    sock.ev.on("error", (err) => {
      console.error("⚠️ Socket error:", err?.message || err);
    });
  } catch (error) {
    console.error("❌ Failed to start session:", error?.message || error);
    try {
      socket.emit("whatsapp-session-update", {
        status: "error",
        error: String(error?.message || error),
      });
    } catch {}
  }
}

// Explicit user stop (logout)
export async function stopWhatsappSession(userId) {
  const sock = activeSessions.get(userId);
  if (sock) {
    try {
      await sock.logout();
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
