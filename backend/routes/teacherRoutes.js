import express from 'express';
import { getEnrolledStudents } from '../controllers/teacherController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/:teacherId/enrolled-students', protect, restrictTo('teacher'), getEnrolledStudents);

export default router;
