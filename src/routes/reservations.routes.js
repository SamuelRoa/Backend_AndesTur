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
  rejectReservation,
} from "../controllers/reservations.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import {
  createReservationSchema,
  updateReservationSchema,
  preReservationSchema,
  reservationQuerySchema,
  rejectReservationSchema,
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

router.get("/", authenticateToken, authorizeRead(), getAllReservations);
router.get("/:id", authenticateToken, authorizeRead(), getReservationById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("reservations"),
  validateSchema(createReservationSchema),
  createReservation,
);
router.post("/pre-reservation", validateSchema(preReservationSchema), createPreReservation);
router.post(
  "/query",
  reservationQueryLimiter,
  validateSchema(reservationQuerySchema),
  queryReservations,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("reservations"),
  validateSchema(updateReservationSchema),
  updateReservation,
);
router.put(
  "/:id/reject",
  authenticateToken,
  authorizeWrite("reservations"),
  validateSchema(rejectReservationSchema),
  rejectReservation,
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeWrite("reservations"),
  deleteReservation,
);

export default router;
