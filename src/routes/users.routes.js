import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/users.controller.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
} from "../validations/schemas.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", validateSchema(createUserSchema), createUser);
router.put("/:id", validateSchema(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

export default router;
