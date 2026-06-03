import express from "express";
import {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  createPreReservation,
} from "../controllers/reservations.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  createReservationSchema,
  updateReservationSchema,
  preReservationSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllReservations);
router.get("/:id", getReservationById);
router.post("/", validateSchema(createReservationSchema), createReservation);
router.post("/pre-reservation", validateSchema(preReservationSchema), createPreReservation);
router.put("/:id", validateSchema(updateReservationSchema), updateReservation);
router.delete("/:id", deleteReservation);

export default router;
