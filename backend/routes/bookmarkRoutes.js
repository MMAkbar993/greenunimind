import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createBookmark,
  getBookmarksByLectureAndStudent,
  updateBookmark,
  deleteBookmark,
  getSharedBookmarks,
  shareBookmark,
  getBookmarksByCategory,
  getBookmarksByTags,
} from '../controllers/bookmarkController.js';

const router = express.Router();

// Literal-prefixed routes must come before the generic /:id and
// /:lectureId/:studentId patterns so Express doesn't swallow them.
router.get('/shared/:lectureId', protect, getSharedBookmarks);
router.post('/share/:bookmarkId', protect, shareBookmark);
router.get('/category/:studentId/:category', protect, getBookmarksByCategory);
router.post('/tags/:studentId', protect, getBookmarksByTags);

router.post('/:studentId', protect, createBookmark);
router.get('/:lectureId/:studentId', protect, getBookmarksByLectureAndStudent);
router.patch('/:id', protect, updateBookmark);
router.delete('/:id', protect, deleteBookmark);

export default router;
