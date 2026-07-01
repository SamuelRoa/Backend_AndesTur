import express from "express";
import {
  getAllStaffPackages,
  getStaffPackageById,
  createStaffPackage,
  updateStaffPackage,
  deleteStaffPackage,
} from "../controllers/staff_package.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import { createStaffPackageSchema, updateStaffPackageSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("staff-package:read"), getAllStaffPackages);
router.get("/:id", authenticateToken, requirePermission("staff-package:read"), getStaffPackageById);
router.post(
  "/",
  authenticateToken,
  requirePermission("staff-packages:write"),
  validateSchema(createStaffPackageSchema),
  createStaffPackage,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("staff-packages:write"),
  validateSchema(updateStaffPackageSchema),
  updateStaffPackage,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("staff-packages:write"),
  deleteStaffPackage,
);

export default router;
