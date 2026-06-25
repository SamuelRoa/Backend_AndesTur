import express from "express";
import {
  getAllStates,
  getStateById,
  createState,
  updateState,
  deleteState,
} from "../controllers/state.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import { createStateSchema, updateStateSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllStates);
router.get("/:id", authenticateToken, authorizeRead(), getStateById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("states"),
  validateSchema(createStateSchema),
  createState,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("states"),
  validateSchema(updateStateSchema),
  updateState,
);
router.delete("/:id", authenticateToken, authorizeWrite("states"), deleteState);

export default router;
