import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
} from "../controllers/users.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  authenticateToken,
  authorizeAdmin,
} from "../middleware/auth.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeAdmin(), getAllUsers);
router.get("/profile", authenticateToken, getProfile);
router.put(
  "/profile_update",
  authenticateToken,
  validateSchema(updateProfileSchema),
  updateProfile,
);
router.get("/:id", authenticateToken, authorizeAdmin(), getUserById);
router.post(
  "/",
  authenticateToken,
  authorizeAdmin(),
  validateSchema(createUserSchema),
  createUser,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin(),
  validateSchema(updateUserSchema),
  updateUser,
);
router.delete("/:id", authenticateToken, authorizeAdmin(), deleteUser);

export default router;
