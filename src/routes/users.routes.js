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
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/profile", authenticateToken, getProfile);
router.put(
  "/profile_update",
  authenticateToken,
  validateSchema(updateProfileSchema),
  updateProfile,
);
router.get("/:id", getUserById);
router.post("/", validateSchema(createUserSchema), createUser);
router.put("/:id", validateSchema(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

export default router;
