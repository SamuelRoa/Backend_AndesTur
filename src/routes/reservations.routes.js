import express from "express";
import {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} from "../controllers/reservations.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  createReservationSchema,
  updateReservationSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllReservations);
router.get("/:id", getReservationById);
router.post("/", validateSchema(createReservationSchema), createReservation);
router.put("/:id", validateSchema(updateReservationSchema), updateReservation);
router.delete("/:id", deleteReservation);

export default router;
