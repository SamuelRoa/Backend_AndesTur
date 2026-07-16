import express from "express";
import {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from "../controllers/staff_documents.controller.js";
import { authenticateToken, requirePermission } from "../middleware/auth.middleware.js";
import { uploadDocument as uploadMiddleware } from "../utils/upload.js";

const router = express.Router();

router.get("/:id/documents", authenticateToken, requirePermission("staff:read"), getDocuments);
router.post("/:id/documents", authenticateToken, requirePermission("staff:write"), uploadMiddleware.single("file"), uploadDocument);
router.get("/:id/documents/:docId/download", authenticateToken, requirePermission("staff:read"), downloadDocument);
router.delete("/:id/documents/:docId", authenticateToken, requirePermission("staff:write"), deleteDocument);

export default router;