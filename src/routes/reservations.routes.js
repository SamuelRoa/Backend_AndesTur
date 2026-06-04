import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  createPreReservation,
  queryReservations,
} from "../controllers/reservations.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  createReservationSchema,
  updateReservationSchema,
  preReservationSchema,
  reservationQuerySchema,
} from "../validations/schemas.js";

const router = express.Router();

const reservationQueryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Demasiadas solicitudes. Intente de nuevo en un minuto.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", getAllReservations);
router.get("/:id", getReservationById);
router.post("/", validateSchema(createReservationSchema), createReservation);
router.post("/pre-reservation", validateSchema(preReservationSchema), createPreReservation);
router.post("/query", reservationQueryLimiter, validateSchema(reservationQuerySchema), queryReservations);
router.put("/:id", validateSchema(updateReservationSchema), updateReservation);
router.delete("/:id", deleteReservation);

export default router;
