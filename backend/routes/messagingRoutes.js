import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getFolders,
  getThreadsByFolder,
  getThreadMessages,
  searchMessages,
  getMessageStats,
} from '../controllers/messagingController.js';

const router = express.Router();

router.get('/users/:userId/folders', protect, getFolders);
router.get('/users/:userId/threads', protect, getThreadsByFolder);
router.get('/users/:userId/search', protect, searchMessages);
router.get('/users/:userId/stats', protect, getMessageStats);
router.get('/conversations/:threadId/messages', protect, getThreadMessages);

export default router;
