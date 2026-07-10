import express from "express";
import {
  getAllTrash,
  getTrashItemById,
  restoreTrashItem,
  permanentDeleteTrashItem,
} from "../controllers/trash.controller.js";
import {
  authenticateToken,
  requirePermission,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, requirePermission("*"), getAllTrash);
router.get("/:id", authenticateToken, requirePermission("*"), getTrashItemById);
router.post("/:id/restore", authenticateToken, requirePermission("*"), restoreTrashItem);
router.delete("/:id", authenticateToken, requirePermission("*"), permanentDeleteTrashItem);

export default router;
