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
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import { createDestinationSchema, updateDestinationSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllDestinations);
router.get("/:id", authenticateToken, authorizeRead(), getDestinationById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("destinations"),
  validateSchema(createDestinationSchema),
  createDestination,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("destinations"),
  validateSchema(updateDestinationSchema),
  updateDestination,
);
router.delete("/:id", authenticateToken, authorizeWrite("destinations"), deleteDestination);

export default router;
