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
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import { createStateSchema, updateStateSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("state:read"), getAllStates);
router.get("/:id", authenticateToken, requirePermission("state:read"), getStateById);
router.post(
  "/",
  authenticateToken,
  requirePermission("states:write"),
  validateSchema(createStateSchema),
  createState,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("states:write"),
  validateSchema(updateStateSchema),
  updateState,
);
router.delete("/:id", authenticateToken, requirePermission("states:write"), deleteState);

export default router;
