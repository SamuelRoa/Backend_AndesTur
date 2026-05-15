import express from "express";
import {
  getAllStates,
  getStateById,
  createState,
  updateState,
  deleteState,
} from "../controllers/state.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { createStateSchema, updateStateSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllStates);
router.get("/:id", getStateById);
router.post("/", validateSchema(createStateSchema), createState);
router.put("/:id", validateSchema(updateStateSchema), updateState);
router.delete("/:id", deleteState);

export default router;
