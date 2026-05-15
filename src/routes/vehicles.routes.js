import express from "express";
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicles.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);
router.post("/", validateSchema(createVehicleSchema), createVehicle);
router.put("/:id", validateSchema(updateVehicleSchema), updateVehicle);
router.delete("/:id", deleteVehicle);

export default router;
