import express from "express";
import {
  getAllPaymentDetails,
  getPaymentDetailById,
  createPaymentDetail,
  updatePaymentDetail,
  deletePaymentDetail,
} from "../controllers/payment_detail.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { createPaymentDetailSchema, updatePaymentDetailSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllPaymentDetails);
router.get("/:id", getPaymentDetailById);
router.post("/", validateSchema(createPaymentDetailSchema), createPaymentDetail);
router.put("/:id", validateSchema(updatePaymentDetailSchema), updatePaymentDetail);
router.delete("/:id", deletePaymentDetail);

export default router;
