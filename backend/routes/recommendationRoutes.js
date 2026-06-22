import express from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';
import { protect, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalProtect, getRecommendations);

export default router;
