import express from "express";
import multer from "multer";
import {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  createPreReservation,
  queryReservations,
  rejectReservation,
  payAfterPreReservation,
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
  payAfterPreReservationSchema,
} from "../validations/schemas.js";
import { reservationQueryRateLimiter } from "../middleware/reservationLimit.middleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
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
  reservationQueryRateLimiter,
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
router.post(
  "/:id/pay",
  upload.single("receipt"),
  payAfterPreReservation,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("reservations:write"),
  deleteReservation,
);

export default router;
