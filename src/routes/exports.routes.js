import express from 'express';
import { exportData } from '../controllers/exports.controller.js';

const router = express.Router();

router.get('/:module/:format', exportData);

export default router;
