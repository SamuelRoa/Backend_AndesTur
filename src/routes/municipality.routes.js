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
  requirePermission,
  
} from "../middleware/auth.middleware.js";
import { createMunicipalitySchema, updateMunicipalitySchema } from "../validations/schemas.js";
import { cacheMiddleware } from "../middleware/index.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("municipality:read"), cacheMiddleware("municipalities", 86400), getAllMunicipalities);
router.get("/:id", authenticateToken, requirePermission("municipality:read"), cacheMiddleware("municipalities", 86400), getMunicipalityById);

router.post(
  "/",
  authenticateToken,
  requirePermission("municipalities:write"),
  validateSchema(createMunicipalitySchema),
  createMunicipality,
);
router.put(
  "/:id",
  authenticateToken,
  requirePermission("municipalities:write"),
  validateSchema(updateMunicipalitySchema),
  updateMunicipality,
);
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("municipalities:write"),
  deleteMunicipality,
);

export default router;
