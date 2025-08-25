import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import UserRoutes from "./src/users/user.routes.js";
import AuthRoutes from "./src/auth/auth.routes.js";
import WhatsappRoutes from "./src/whatsapp/whatsapp.routes.js";
import AudienceRoutes from "./src/whatsapp/audience/audience.routes.js";
import createSocketServer from "./src/realtime/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "waibusiness-backend" });
});

// mount routes from src/* when ready
app.use("/api/users", UserRoutes);
app.use("/api/auth", AuthRoutes);
app.use("/api/audience", AudienceRoutes);
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
