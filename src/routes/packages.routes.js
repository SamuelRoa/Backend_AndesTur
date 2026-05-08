import express from "express";
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} from "../controllers/packages.controller.js";

const router = express.Router();

router.get("/", getAllPackages);
router.get("/:id", getPackageById);
router.post("/", createPackage);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);

export default router;
