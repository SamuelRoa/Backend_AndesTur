import express from "express";
import apiRoutes from "./routes/index.js";
import { redisRateLimiter } from "./middleware/index.js";

const router = express.Router();

router.use("/", redisRateLimiter, apiRoutes);

export default router;

