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
  createPackageSchema,
  updatePackageSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllPackages);
router.get("/:id", getPackageById);
router.post("/", validateSchema(createPackageSchema), createPackage);
router.put("/:id", validateSchema(updatePackageSchema), updatePackage);
router.delete("/:id", deletePackage);

export default router;
