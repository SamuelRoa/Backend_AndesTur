import express from "express";
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} from "../controllers/packages.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import {
  createPackageSchema,
  updatePackageSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("packages:read"), getAllPackages);
router.get("/:id", authenticateToken, requirePermission("packages:read"), getPackageById);
router.post(
  "/",
  authenticateToken,
  requirePermission("packages:write"),
  validateSchema(createPackageSchema),
  createPackage,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("packages:write"),
  validateSchema(updatePackageSchema),
  updatePackage,
);
router.delete("/:id", authenticateToken, requirePermission("packages:write"), deletePackage);

export default router;
