import express from "express";
import {
  getAllMunicipalities,
  getMunicipalityById,
  createMunicipality,
  updateMunicipality,
  deleteMunicipality,
} from "../controllers/municipality.controller.js";

const router = express.Router();

router.get("/", getAllMunicipalities);
router.get("/:id", getMunicipalityById);
router.post("/", createMunicipality);
router.put("/:id", updateMunicipality);
router.delete("/:id", deleteMunicipality);

export default router;
