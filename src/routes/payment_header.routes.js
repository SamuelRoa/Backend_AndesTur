import express from "express";
import {
  getAllPaymentHeaders,
  getPaymentHeaderById,
  createPaymentHeader,
  updatePaymentHeader,
  deletePaymentHeader,
} from "../controllers/payment_header.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import { createPaymentHeaderSchema, updatePaymentHeaderSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("payment-header:read"), getAllPaymentHeaders);
router.get("/:id", authenticateToken, requirePermission("payment-header:read"), getPaymentHeaderById);
router.post(
  "/",
  authenticateToken,
  requirePermission("payment-headers:write"),
  validateSchema(createPaymentHeaderSchema),
  createPaymentHeader,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("payment-headers:write"),
  validateSchema(updatePaymentHeaderSchema),
  updatePaymentHeader,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("payment-headers:write"),
  deletePaymentHeader,
);

export default router;
