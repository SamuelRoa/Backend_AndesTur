import express from "express";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roles.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/auth.middleware.js";
import { createRoleSchema, updateRoleSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeAdmin(), getAllRoles);
router.get("/:id", authenticateToken, authorizeAdmin(), getRoleById);
router.post(
  "/",
  authenticateToken,
  authorizeAdmin(),
  validateSchema(createRoleSchema),
  createRole,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin(),
  validateSchema(updateRoleSchema),
  updateRole,
);
router.delete("/:id", authenticateToken, authorizeAdmin(), deleteRole);

export default router;
