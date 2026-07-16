import express from "express";
import { authenticateToken, requirePermission } from "../middleware/auth.middleware.js";
import {
  getSchedules, saveSchedules, deleteSchedule,
} from "../controllers/staff_schedules.controller.js";
import {
  getExceptions, createException, deleteException, downloadExceptionAttachment,
} from "../controllers/staff_exceptions.controller.js";
import { uploadException } from "../utils/upload.js";

const router = express.Router();

router.get("/:id/schedules", authenticateToken, requirePermission("staff:read"), getSchedules);
router.put("/:id/schedules", authenticateToken, requirePermission("staff:write"), saveSchedules);
router.delete("/schedules/:scheduleId", authenticateToken, requirePermission("staff:write"), deleteSchedule);

router.get("/:id/exceptions", authenticateToken, requirePermission("staff:read"), getExceptions);
router.post("/:id/exceptions", authenticateToken, requirePermission("staff:write"), uploadException.single("attachment"), createException);
router.get("/exceptions/:exceptionId/download", authenticateToken, requirePermission("staff:read"), downloadExceptionAttachment);
router.delete("/exceptions/:exceptionId", authenticateToken, requirePermission("staff:write"), deleteException);

export default router;