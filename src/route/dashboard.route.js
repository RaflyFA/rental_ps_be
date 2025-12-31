import express from 'express';
import {
  getStats,
  getRecentActivity,
  getActiveRooms,
  getRevenueDetail,
  getRevenueTrend,
} from '../controller/dashboard/dashboard.js';

const router = express.Router();

// Route: /dashboard/stats
router.get('/stats', getStats);

// Route: /dashboard/recent
router.get('/recent', getRecentActivity);

// Route: /dashboard/active-rooms
router.get('/active-rooms', getActiveRooms);

// Route: /dashboard/revenue-detail
router.get('/revenue-detail', getRevenueDetail);

// Route: /dashboard/revenue-trend
router.get('/revenue-trend', getRevenueTrend);

export default router;
