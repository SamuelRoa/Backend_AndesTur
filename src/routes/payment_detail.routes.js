import express from "express";
import {
  getAllPaymentDetails,
  getPaymentDetailById,
  createPaymentDetail,
  updatePaymentDetail,
  deletePaymentDetail,
} from "../controllers/payment_detail.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import { createPaymentDetailSchema, updatePaymentDetailSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllPaymentDetails);
router.get("/:id", authenticateToken, authorizeRead(), getPaymentDetailById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("payment-details"),
  validateSchema(createPaymentDetailSchema),
  createPaymentDetail,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("payment-details"),
  validateSchema(updatePaymentDetailSchema),
  updatePaymentDetail,
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeWrite("payment-details"),
  deletePaymentDetail,
);

export default router;
