import express from 'express';
import { getMonthlyImpactReport, getAvailableMonths } from '../controllers/impactController.js';

const router = express.Router();

router.get('/report', getMonthlyImpactReport);
router.get('/available-months', getAvailableMonths);

export default router;
