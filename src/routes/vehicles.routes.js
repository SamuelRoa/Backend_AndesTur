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
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("vehicles:read"), getAllVehicles);
router.get("/:id", authenticateToken, requirePermission("vehicles:read"), getVehicleById);
router.post(
  "/",
  authenticateToken,
  requirePermission("vehicles:write"),
  validateSchema(createVehicleSchema),
  createVehicle,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("vehicles:write"),
  validateSchema(updateVehicleSchema),
  updateVehicle,
);
router.delete("/:id", authenticateToken, requirePermission("vehicles:write"), deleteVehicle);

export default router;
