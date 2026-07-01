import express from "express";
import {
  getAllPackagesDestinations,
  getPackageDestinationById,
  createPackageDestination,
  updatePackageDestination,
  deletePackageDestination,
} from "../controllers/packages_destinations.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import { createPackageDestinationSchema, updatePackageDestinationSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("packages-destinations:read"), getAllPackagesDestinations);
router.get("/:id", authenticateToken, requirePermission("packages-destinations:read"), getPackageDestinationById);
router.post(
  "/",
  authenticateToken,
  requirePermission("packages-destinations:write"),
  validateSchema(createPackageDestinationSchema),
  createPackageDestination,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("packages-destinations:write"),
  validateSchema(updatePackageDestinationSchema),
  updatePackageDestination,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("packages-destinations:write"),
  deletePackageDestination,
);

export default router;
