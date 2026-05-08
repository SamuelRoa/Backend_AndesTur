import express from "express";
import {
  getAllPaymentHeaders,
  getPaymentHeaderById,
  createPaymentHeader,
  updatePaymentHeader,
  deletePaymentHeader,
} from "../controllers/payment_header.controller.js";

const router = express.Router();

router.get("/", getAllPaymentHeaders);
router.get("/:id", getPaymentHeaderById);
router.post("/", createPaymentHeader);
router.put("/:id", updatePaymentHeader);
router.delete("/:id", deletePaymentHeader);

export default router;
