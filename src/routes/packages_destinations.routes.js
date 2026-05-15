import express from "express";
import {
  getAllPackagesDestinations,
  getPackageDestinationById,
  createPackageDestination,
  updatePackageDestination,
  deletePackageDestination,
} from "../controllers/packages_destinations.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { createPackageDestinationSchema, updatePackageDestinationSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllPackagesDestinations);
router.get("/:id", getPackageDestinationById);
router.post("/", validateSchema(createPackageDestinationSchema), createPackageDestination);
router.put("/:id", validateSchema(updatePackageDestinationSchema), updatePackageDestination);
router.delete("/:id", deletePackageDestination);

export default router;
