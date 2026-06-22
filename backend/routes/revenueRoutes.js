import express from 'express';
import { recordRevenue, getRevenueSummary } from '../controllers/revenueController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, restrictTo('teacher'), recordRevenue);
router.get('/summary', getRevenueSummary);

export default router;
