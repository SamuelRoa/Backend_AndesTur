import express from "express";
import {
  getAllDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
} from "../controllers/destinations.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  requirePermission,
} from "../middleware/auth.middleware.js";
import {
  createDestinationSchema,
  updateDestinationSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllDestinations);
router.get("/:id", getDestinationById);
router.post(
  "/",
  authenticateToken,
  requirePermission("destinations:write"),
  validateSchema(createDestinationSchema),
  createDestination,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("destinations:write"),
  validateSchema(updateDestinationSchema),
  updateDestination,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("destinations:write"),
  deleteDestination,
);

export default router;
