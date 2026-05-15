import express from "express";
import {
  getAllPaymentHeaders,
  getPaymentHeaderById,
  createPaymentHeader,
  updatePaymentHeader,
  deletePaymentHeader,
} from "../controllers/payment_header.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { createPaymentHeaderSchema, updatePaymentHeaderSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllPaymentHeaders);
router.get("/:id", getPaymentHeaderById);
router.post("/", validateSchema(createPaymentHeaderSchema), createPaymentHeader);
router.put("/:id", validateSchema(updatePaymentHeaderSchema), updatePaymentHeader);
router.delete("/:id", deletePaymentHeader);

export default router;
