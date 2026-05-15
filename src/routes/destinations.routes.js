import express from "express";
import {
  getAllDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
} from "../controllers/destinations.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { createDestinationSchema, updateDestinationSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllDestinations);
router.get("/:id", getDestinationById);
router.post("/", validateSchema(createDestinationSchema), createDestination);
router.put("/:id", validateSchema(updateDestinationSchema), updateDestination);
router.delete("/:id", deleteDestination);

export default router;
