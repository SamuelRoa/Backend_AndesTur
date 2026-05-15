import express from "express";
import {
  getAllStaffPackages,
  getStaffPackageById,
  createStaffPackage,
  updateStaffPackage,
  deleteStaffPackage,
} from "../controllers/staff_package.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { createStaffPackageSchema, updateStaffPackageSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllStaffPackages);
router.get("/:id", getStaffPackageById);
router.post("/", validateSchema(createStaffPackageSchema), createStaffPackage);
router.put("/:id", validateSchema(updateStaffPackageSchema), updateStaffPackage);
router.delete("/:id", deleteStaffPackage);

export default router;
