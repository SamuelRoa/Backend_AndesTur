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
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import { createPaymentHeaderSchema, updatePaymentHeaderSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllPaymentHeaders);
router.get("/:id", authenticateToken, authorizeRead(), getPaymentHeaderById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("payment-headers"),
  validateSchema(createPaymentHeaderSchema),
  createPaymentHeader,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("payment-headers"),
  validateSchema(updatePaymentHeaderSchema),
  updatePaymentHeader,
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeWrite("payment-headers"),
  deletePaymentHeader,
);

export default router;
