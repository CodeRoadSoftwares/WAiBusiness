import express from "express";
import { UserController } from "./user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", UserController.createUser);
router.get("/profile", requireAuth, UserController.getUserProfile);

export default router;
