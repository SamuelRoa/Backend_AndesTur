import express from "express";
import usersRoutes from "./users.routes.js";
import packagesRoutes from "./packages.routes.js";
import destinationsRoutes from "./destinations.routes.js";
import reservationsRoutes from "./reservations.routes.js";
import customersRoutes from "./customers.routes.js";
import municipalityRoutes from "./municipality.routes.js";
import packagesDestinationsRoutes from "./packages_destinations.routes.js";
import paymentDetailRoutes from "./payment_detail.routes.js";
import paymentHeaderRoutes from "./payment_header.routes.js";
import rolesRoutes from "./roles.routes.js";
import staffRoutes from "./staff.routes.js";
import staffPackageRoutes from "./staff_package.routes.js";
import stateRoutes from "./state.routes.js";
import vehiclesRoutes from "./vehicles.routes.js";
import { getHealth } from "../controllers/health.controller.js";

const router = express.Router();

router.get("/", getHealth);
router.use("/users", usersRoutes);
router.use("/packages", packagesRoutes);
router.use("/destinations", destinationsRoutes);
router.use("/reservations", reservationsRoutes);
router.use("/customers", customersRoutes);
router.use("/municipalities", municipalityRoutes);
router.use("/packages-destinations", packagesDestinationsRoutes);
router.use("/payment-details", paymentDetailRoutes);
router.use("/payment-headers", paymentHeaderRoutes);
router.use("/roles", rolesRoutes);
router.use("/staff", staffRoutes);
router.use("/staff-packages", staffPackageRoutes);
router.use("/states", stateRoutes);
router.use("/vehicles", vehiclesRoutes);

export default router;
