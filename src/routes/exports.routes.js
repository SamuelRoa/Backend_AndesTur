import express from 'express';
import { exportData } from '../controllers/exports.controller.js';
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get('/:module/:format', authenticateToken, authorizeAdmin(), exportData);

export default router;
