import express from "express";
import {
  getAllPackagesDestinations,
  getPackageDestinationById,
  createPackageDestination,
  updatePackageDestination,
  deletePackageDestination,
} from "../controllers/packages_destinations.controller.js";

const router = express.Router();

router.get("/", getAllPackagesDestinations);
router.get("/:id", getPackageDestinationById);
router.post("/", createPackageDestination);
router.put("/:id", updatePackageDestination);
router.delete("/:id", deletePackageDestination);

export default router;
