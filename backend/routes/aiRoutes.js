import express from 'express';
import {
  enhanceTitle,
  enhanceSubtitle,
  enhanceDescription,
  suggestCategory,
  generateOutline,
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/enhance-title', protect, enhanceTitle);
router.post('/enhance-subtitle', protect, enhanceSubtitle);
router.post('/enhance-description', protect, enhanceDescription);
router.post('/suggest-category', protect, suggestCategory);
router.post('/generate-outline', protect, generateOutline);

export default router;
