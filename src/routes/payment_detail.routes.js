import express from "express";
import {
  getAllPaymentDetails,
  getPaymentDetailById,
  createPaymentDetail,
  updatePaymentDetail,
  deletePaymentDetail,
} from "../controllers/payment_detail.controller.js";

const router = express.Router();

router.get("/", getAllPaymentDetails);
router.get("/:id", getPaymentDetailById);
router.post("/", createPaymentDetail);
router.put("/:id", updatePaymentDetail);
router.delete("/:id", deletePaymentDetail);

export default router;
