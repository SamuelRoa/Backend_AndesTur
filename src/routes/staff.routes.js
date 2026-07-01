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
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import {
  createStaffSchema,
  updateStaffSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("staff:read"), getAllStaff);
router.get("/:id", authenticateToken, requirePermission("staff:read"), getStaffById);
router.post(
  "/",
  authenticateToken,
  requirePermission("staff:write"),
  validateSchema(createStaffSchema),
  createStaff,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("staff:write"),
  validateSchema(updateStaffSchema),
  updateStaff,
);
router.delete("/:id", authenticateToken, requirePermission("staff:write"), deleteStaff);

export default router;
