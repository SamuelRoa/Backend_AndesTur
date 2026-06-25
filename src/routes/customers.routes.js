import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllCustomers);
router.get("/:id", authenticateToken, authorizeRead(), getCustomerById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("customers"),
  validateSchema(createCustomerSchema),
  createCustomer,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("customers"),
  validateSchema(updateCustomerSchema),
  updateCustomer,
);
router.delete("/:id", authenticateToken, authorizeWrite("customers"), deleteCustomer);

export default router;
