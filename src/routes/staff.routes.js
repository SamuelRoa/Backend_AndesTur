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
  authenticateToken,
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import {
  createStaffSchema,
  updateStaffSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllStaff);
router.get("/:id", authenticateToken, authorizeRead(), getStaffById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("staff"),
  validateSchema(createStaffSchema),
  createStaff,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("staff"),
  validateSchema(updateStaffSchema),
  updateStaff,
);
router.delete("/:id", authenticateToken, authorizeWrite("staff"), deleteStaff);

export default router;
