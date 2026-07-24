import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createOrUpdateNote,
  getNoteByLectureAndStudent,
  deleteNote,
  getSharedNotes,
  shareNote,
} from '../controllers/noteController.js';

const router = express.Router();

// Literal-prefixed routes must come before the generic /:lectureId/:studentId
// pattern so Express doesn't swallow them.
router.get('/shared/:lectureId', protect, getSharedNotes);
router.post('/share/:noteId', protect, shareNote);

router.post('/:studentId', protect, createOrUpdateNote);
router.get('/:lectureId/:studentId', protect, getNoteByLectureAndStudent);
router.delete('/:id', protect, deleteNote);

export default router;
