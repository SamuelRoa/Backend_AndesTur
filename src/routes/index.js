import express from "express";
import usersRoutes from "./users.routes.js";
import packagesRoutes from "./packages.routes.js";
import destinationsRoutes from "./destinations.routes.js";
import reservationsRoutes from "./reservations.routes.js";
import { getHealth } from "../controllers/health.controller.js";

const router = express.Router();

router.get("/", getHealth);
router.use("/users", usersRoutes);
router.use("/packages", packagesRoutes);
router.use("/destinations", destinationsRoutes);
router.use("/reservations", reservationsRoutes);

export default router;

//xd
