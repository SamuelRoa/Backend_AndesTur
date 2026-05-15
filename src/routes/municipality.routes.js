import express from "express";
import {
  getAllMunicipalities,
  getMunicipalityById,
  createMunicipality,
  updateMunicipality,
  deleteMunicipality,
} from "../controllers/municipality.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { createMunicipalitySchema, updateMunicipalitySchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllMunicipalities);
router.get("/:id", getMunicipalityById);
router.post("/", validateSchema(createMunicipalitySchema), createMunicipality);
router.put("/:id", validateSchema(updateMunicipalitySchema), updateMunicipality);
router.delete("/:id", deleteMunicipality);

export default router;
