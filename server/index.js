import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import UserRoutes from "./src/users/user.routes.js";
import AuthRoutes from "./src/auth/auth.routes.js";
import WhatsappRoutes from "./src/whatsapp/whatsapp.routes.js";
import createSocketServer from "./src/realtime/socket.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "waibusiness-backend" });
});

// mount routes from src/* when ready
app.use("/api/users", UserRoutes);
app.use("/api/auth", AuthRoutes);
app.use("/api/whatsapp", WhatsappRoutes);

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

console.log("Creating HTTP server...");
const io = createSocketServer(server);
console.log("Socket.IO server attached to HTTP server");

async function start() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
      console.log(`[server] Socket.IO server ready on port ${PORT}`);
    });
  } catch (error) {
    console.error("[server] failed to start:", error);
    process.exit(1);
  }
}

start();
