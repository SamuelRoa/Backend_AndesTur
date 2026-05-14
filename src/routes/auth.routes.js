import express from "express";
import {
  register,
  login,
  verifyAuth,
  getProfile,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Rutas públicas
router.post("/register", register);
router.post("/login", login);

// Rutas protegidas
router.get("/verify", authenticateToken, verifyAuth);
router.get("/profile", authenticateToken, getProfile);

export default router;
