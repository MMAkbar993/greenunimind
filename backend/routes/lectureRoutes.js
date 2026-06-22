import express from 'express';
import {
  createLecture,
  getLecturesByCourseId,
  getLectureById,
  updateLectureOrder,
  updateLecture,
  deleteLecture,
  getLectureProgress,
  updateLectureProgress,
} from '../controllers/lectureController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.post('/:id/create-lecture', protect, restrictTo('teacher'), createLecture);

router.get('/:id/get-lectures', protect, getLecturesByCourseId);

router.get('/:id/progress', protect, getLectureProgress);
router.put('/:id/progress', protect, updateLectureProgress);

router.get('/:id', protect, getLectureById);

router.patch('/:id/update-order', protect, restrictTo('teacher'), updateLectureOrder);

router.patch('/:courseId/update-lecture/:lectureId', protect, restrictTo('teacher'), updateLecture);

router.delete('/:courseId/delete-lecture/:lectureId', protect, restrictTo('teacher'), deleteLecture);

export default router;
