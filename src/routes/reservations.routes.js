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
  requirePermission,
  
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

router.get("/", authenticateToken, requirePermission("reservations:read"), getAllReservations);
router.get("/:id", authenticateToken, requirePermission("reservations:read"), getReservationById);
router.post(
  "/",
  authenticateToken,
  requirePermission("reservations:write"),
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
  requirePermission("reservations:write"),
  validateSchema(updateReservationSchema),
  updateReservation,
);
router.put(
  "/:id/reject",
  authenticateToken,
  requirePermission("reservations:write"),
  validateSchema(rejectReservationSchema),
  rejectReservation,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("reservations:write"),
  deleteReservation,
);

export default router;
