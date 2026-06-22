import express from 'express';
import {
  createCourse,
  getCourseById,
  getCreatorCourses,
  getPublishedCourses,
  getPopularCourses,
  searchCourses,
  editCourse,
  deleteCourse,
} from '../controllers/courseController.js';
import { enrollInCourse } from '../controllers/enrollmentController.js';
import { protect, restrictTo, optionalProtect } from '../middleware/auth.js';
import { parseCourseForm } from '../middleware/upload.js';

const router = express.Router();

router.post(
  '/create-course/:teacherId',
  protect,
  restrictTo('teacher'),
  parseCourseForm,
  createCourse
);

router.get('/creator/:teacherId', protect, getCreatorCourses);
router.get('/published-courses', getPublishedCourses);
router.get('/popular-courses', getPopularCourses);
router.get('/search', searchCourses);

router.post('/:courseId/enroll', protect, restrictTo('student'), enrollInCourse);

router.get('/:id', optionalProtect, getCourseById);

router.patch(
  '/edit-course/:id',
  protect,
  restrictTo('teacher'),
  parseCourseForm,
  editCourse
);

router.delete('/delete-course/:id', protect, restrictTo('teacher'), deleteCourse);

export default router;
