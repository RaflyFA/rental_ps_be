import express from 'express';
import { getStats, getRecentActivity } from '../controller/dashboard/dashboard.js';

const router = express.Router();

// Route: /dashboard/stats
router.get('/stats', getStats);

// Route: /dashboard/recent
router.get('/recent', getRecentActivity);

export default router;