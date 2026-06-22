import express from 'express';
import { getAllAchievements, getMyAchievements } from '../controllers/achievementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllAchievements);
router.get('/my', protect, getMyAchievements);

export default router;
