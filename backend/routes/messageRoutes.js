import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendMessage,
  replyToMessage,
  markMessagesAsRead,
  markThreadAsRead,
  toggleMessageStar,
  toggleThreadArchive,
  deleteMessages,
  getNotifications,
  markNotificationsAsRead,
  saveDraft,
  getDrafts,
  deleteDraft,
} from '../controllers/messageController.js';

const router = express.Router();

router.post('/send', protect, sendMessage);
router.post('/threads/:threadId/reply', protect, replyToMessage);
router.patch('/mark-read', protect, markMessagesAsRead);
router.patch('/threads/:threadId/mark-read', protect, markThreadAsRead);
router.patch('/:messageId/star', protect, toggleMessageStar);
router.patch('/threads/:threadId/archive', protect, toggleThreadArchive);
router.delete('/delete', protect, deleteMessages);

router.get('/users/:userId/notifications', protect, getNotifications);
router.patch('/notifications/mark-read', protect, markNotificationsAsRead);

router.get('/users/:userId/drafts', protect, getDrafts);
router.post('/drafts', protect, saveDraft);
router.put('/drafts/:draftId', protect, saveDraft);
router.delete('/drafts/:draftId', protect, deleteDraft);

export default router;
