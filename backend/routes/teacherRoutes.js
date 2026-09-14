import express from 'express';
import { getEnrolledStudents, getPublicTeachers } from '../controllers/teacherController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/public', getPublicTeachers);
router.get('/:teacherId/enrolled-students', protect, restrictTo('teacher'), getEnrolledStudents);

export default router;
