import express from 'express';
import { getMonthlyReportDocsFormat } from '../controllers/impactController.js';

const router = express.Router();

router.get('/monthly', getMonthlyReportDocsFormat);

export default router;
