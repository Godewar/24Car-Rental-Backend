import express from "express";
import { login, register, verifyToken } from "../controllers/authController.js";

const router = express.Router();

// Authentication routes
router.post("/login", login);
router.post("/register", register);
router.post("/verify", verifyToken);

export default router;
