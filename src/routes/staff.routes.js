import express from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staff.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  createStaffSchema,
  updateStaffSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllStaff);
router.get("/:id", getStaffById);
router.post("/", validateSchema(createStaffSchema), createStaff);
router.put("/:id", validateSchema(updateStaffSchema), updateStaff);
router.delete("/:id", deleteStaff);

export default router;
