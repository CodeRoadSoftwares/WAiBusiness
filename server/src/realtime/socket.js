import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import {
  startWhatsappSession,
  getWhatsappSessionStatus,
  stopWhatsappSession,
} from "../whatsapp/sessions/services/whatsappsession.service.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "change-me-access";

function parseCookies(cookieHeader = "") {
  const map = new Map();
  cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .forEach((c) => {
      const [k, ...rest] = c.split("=");
      if (!k) return;
      map.set(k, rest.join("="));
    });
  return map;
}

function authenticateSocket(socket) {
  try {
    // Read cookies from the handshake headers
    const cookieHeader = socket.handshake?.headers?.cookie || "";
    const cookies = parseCookies(cookieHeader);
    const accessToken = cookies.get("accessToken");

    if (!accessToken) {
      return null;
    }

    const decoded = jwt.verify(accessToken, JWT_ACCESS_SECRET);
    if (decoded?.tokenType !== "access") {
      return null;
    }

    return {
      id: decoded.sub,
      plan: decoded.plan,
      phone: decoded.phone,
    };
  } catch (_e) {
    return null;
  }
}

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173"],
      credentials: true,
    },
    allowEIO3: true, // Allow Engine.IO v3 clients
    transports: ["websocket", "polling"],
  });

  console.log("Socket.IO server created successfully");

  io.on("connection", (socket) => {
    console.log(
      "New socket connection attempt from:",
      socket.handshake.address
    );
    console.log("Socket headers:", socket.handshake.headers);

    const user = authenticateSocket(socket);
    if (!user) {
      console.log("Socket authentication failed - unauthorized");
      socket.emit("whatsapp-session-update", { status: "unauthorized" });
      socket.disconnect(true);
      return;
    }

    console.log("Socket authenticated successfully for user:", user.id);

    socket.on("start-whatsapp-session", async (payload) => {
      console.log(
        "🎯 Socket event 'start-whatsapp-session' received for user:",
        user.id
      );
      console.log("Payload:", payload);
      try {
        await startWhatsappSession({ userId: user.id, socket });
      } catch (error) {
        console.error("❌ Error starting WhatsApp session:", error);
        socket.emit("whatsapp-session-update", {
          status: "error",
          message: error?.message || "failed to start",
        });
      }
    });

    socket.on("check-whatsapp-status", async () => {
      console.log("Checking WhatsApp status for user:", user.id);
      const status = await getWhatsappSessionStatus(user.id);
      socket.emit("whatsapp-session-update", status);
    });

    socket.on("stop-whatsapp-session", () => {
      console.log("Stopping WhatsApp session for user:", user.id);
      stopWhatsappSession(user.id);
      socket.emit("whatsapp-session-update", { status: "disconnected" });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected for user:", user.id, "Reason:", reason);
    });
  });

  return io;
}

export default createSocketServer;
