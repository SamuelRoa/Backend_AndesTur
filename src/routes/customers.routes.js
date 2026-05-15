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
  createCustomerSchema,
  updateCustomerSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllCustomers);
router.get("/:id", getCustomerById);
router.post("/", validateSchema(createCustomerSchema), createCustomer);
router.put("/:id", validateSchema(updateCustomerSchema), updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
