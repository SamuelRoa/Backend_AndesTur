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
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import { createStaffPackageSchema, updateStaffPackageSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllStaffPackages);
router.get("/:id", authenticateToken, authorizeRead(), getStaffPackageById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("staff-packages"),
  validateSchema(createStaffPackageSchema),
  createStaffPackage,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("staff-packages"),
  validateSchema(updateStaffPackageSchema),
  updateStaffPackage,
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeWrite("staff-packages"),
  deleteStaffPackage,
);

export default router;
