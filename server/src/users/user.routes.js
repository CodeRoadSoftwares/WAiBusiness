import express from "express";
import { UserController } from "./user.controller.js";

const router = express.Router();

router.post("/register", UserController.createUser);

export default router;
