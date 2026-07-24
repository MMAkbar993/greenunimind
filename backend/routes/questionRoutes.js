import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createQuestion,
  getQuestionsByLectureAndStudent,
  getQuestionsByLecture,
  answerQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';

const router = express.Router();

// Literal-prefixed routes must come before the generic /:id and
// /:lectureId/:studentId patterns so Express doesn't swallow them.
router.get('/lecture/:lectureId', protect, getQuestionsByLecture);
router.patch('/answer/:id', protect, answerQuestion);

router.post('/:studentId', protect, createQuestion);
router.get('/:lectureId/:studentId', protect, getQuestionsByLectureAndStudent);
router.patch('/:id', protect, updateQuestion);
router.delete('/:id', protect, deleteQuestion);

export default router;
