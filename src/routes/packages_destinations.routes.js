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
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import { createPackageDestinationSchema, updatePackageDestinationSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllPackagesDestinations);
router.get("/:id", authenticateToken, authorizeRead(), getPackageDestinationById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("packages-destinations"),
  validateSchema(createPackageDestinationSchema),
  createPackageDestination,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("packages-destinations"),
  validateSchema(updatePackageDestinationSchema),
  updatePackageDestination,
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeWrite("packages-destinations"),
  deletePackageDestination,
);

export default router;
