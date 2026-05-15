import express from "express";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roles.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { createRoleSchema, updateRoleSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllRoles);
router.get("/:id", getRoleById);
router.post("/", validateSchema(createRoleSchema), createRole);
router.put("/:id", validateSchema(updateRoleSchema), updateRole);
router.delete("/:id", deleteRole);

export default router;
