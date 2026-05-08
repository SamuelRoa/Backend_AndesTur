import express from "express";
import {
  getAllStaffPackages,
  getStaffPackageById,
  createStaffPackage,
  updateStaffPackage,
  deleteStaffPackage,
} from "../controllers/staff_package.controller.js";

const router = express.Router();

router.get("/", getAllStaffPackages);
router.get("/:id", getStaffPackageById);
router.post("/", createStaffPackage);
router.put("/:id", updateStaffPackage);
router.delete("/:id", deleteStaffPackage);

export default router;
