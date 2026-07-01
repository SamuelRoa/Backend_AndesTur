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
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import { createPaymentDetailSchema, updatePaymentDetailSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("payment-detail:read"), getAllPaymentDetails);
router.get("/:id", authenticateToken, requirePermission("payment-detail:read"), getPaymentDetailById);
router.post(
  "/",
  authenticateToken,
  requirePermission("payment-details:write"),
  validateSchema(createPaymentDetailSchema),
  createPaymentDetail,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("payment-details:write"),
  validateSchema(updatePaymentDetailSchema),
  updatePaymentDetail,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("payment-details:write"),
  deletePaymentDetail,
);

export default router;
