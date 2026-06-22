import express from 'express';
import {
  getEnrolledCoursesProgress,
  getCourseProgress,
  markLectureComplete,
  generateCertificate,
} from '../controllers/progressController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:studentId/enrolled-courses-progress', protect, getEnrolledCoursesProgress);
router.get('/:studentId/course-progress/:courseId', protect, getCourseProgress);
router.post('/:studentId/mark-lecture-complete', protect, markLectureComplete);
router.post('/:studentId/generate-certificate/:courseId', protect, generateCertificate);

export default router;
