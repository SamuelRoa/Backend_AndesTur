import express from "express";
import {
  initiatePayment,
  registerManualPayment,
  getPaymentsForReservation,
} from "../controllers/payments.controller.js";
import { authenticateToken, requirePermission } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/initiate", initiatePayment);
router.post(
  "/manual",
  authenticateToken,
  requirePermission("reservations:write"),
  registerManualPayment,
);
router.get("/:id", getPaymentsForReservation);

export default router;
