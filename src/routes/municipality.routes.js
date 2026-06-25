import express from "express";
import {
  getAllMunicipalities,
  getMunicipalityById,
  createMunicipality,
  updateMunicipality,
  deleteMunicipality,
} from "../controllers/municipality.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  authorizeRead,
  authorizeWrite,
} from "../middleware/auth.middleware.js";
import { createMunicipalitySchema, updateMunicipalitySchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRead(), getAllMunicipalities);
router.get("/:id", authenticateToken, authorizeRead(), getMunicipalityById);
router.post(
  "/",
  authenticateToken,
  authorizeWrite("municipalities"),
  validateSchema(createMunicipalitySchema),
  createMunicipality,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeWrite("municipalities"),
  validateSchema(updateMunicipalitySchema),
  updateMunicipality,
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeWrite("municipalities"),
  deleteMunicipality,
);

export default router;
