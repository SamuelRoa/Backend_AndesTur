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
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("customers:read"), getAllCustomers);
router.get("/:id", authenticateToken, requirePermission("customers:read"), getCustomerById);
router.post(
  "/",
  authenticateToken,
  requirePermission("customers:write"),
  validateSchema(createCustomerSchema),
  createCustomer,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("customers:write"),
  validateSchema(updateCustomerSchema),
  updateCustomer,
);
router.delete("/:id", authenticateToken, requirePermission("customers:write"), deleteCustomer);

export default router;
