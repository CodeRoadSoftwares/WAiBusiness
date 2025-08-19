import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import UserRoutes from "./src/users/user.routes.js";

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

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[server] failed to start:", error);
    process.exit(1);
  }
}

start();
