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
  authenticateToken,
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllVehicles);
router.get("/:id", authenticateToken, authorizeRead(), getVehicleById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("vehicles"),
  validateSchema(createVehicleSchema),
  createVehicle,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("vehicles"),
  validateSchema(updateVehicleSchema),
  updateVehicle,
);
router.delete("/:id", authenticateToken, authorizeWrite("vehicles"), deleteVehicle);

export default router;
