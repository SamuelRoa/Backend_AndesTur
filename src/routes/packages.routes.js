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
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import {
  createPackageSchema,
  updatePackageSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllPackages);
router.get("/:id", authenticateToken, authorizeRead(), getPackageById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("packages"),
  validateSchema(createPackageSchema),
  createPackage,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("packages"),
  validateSchema(updatePackageSchema),
  updatePackage,
);
router.delete("/:id", authenticateToken, authorizeWrite("packages"), deletePackage);

export default router;
