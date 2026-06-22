import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/send', protect, (req, res) => {
  res.status(201).json({ success: true, data: { _id: Date.now().toString(), ...req.body, createdAt: new Date() } });
});

router.post('/threads/:threadId/reply', protect, (req, res) => {
  res.status(201).json({ success: true, data: { _id: Date.now().toString(), threadId: req.params.threadId, ...req.body, createdAt: new Date() } });
});

router.patch('/mark-read', protect, (req, res) => {
  res.json({ success: true, data: { updated: 0 } });
});

router.patch('/threads/:threadId/mark-read', protect, (req, res) => {
  res.json({ success: true, data: { threadId: req.params.threadId, read: true } });
});

router.patch('/:messageId/star', protect, (req, res) => {
  res.json({ success: true, data: { messageId: req.params.messageId, starred: true } });
});

router.patch('/threads/:threadId/archive', protect, (req, res) => {
  res.json({ success: true, data: { threadId: req.params.threadId, archived: true } });
});

router.delete('/delete', protect, (req, res) => {
  res.json({ success: true, data: { deleted: 0 } });
});

router.get('/users/:userId/notifications', protect, (req, res) => {
  res.json({ success: true, data: [] });
});

router.patch('/notifications/mark-read', protect, (req, res) => {
  res.json({ success: true, data: { updated: 0 } });
});

router.post('/drafts', protect, (req, res) => {
  res.status(201).json({ success: true, data: { _id: Date.now().toString(), ...req.body, isDraft: true } });
});

router.put('/drafts/:draftId', protect, (req, res) => {
  res.json({ success: true, data: { _id: req.params.draftId, ...req.body, isDraft: true } });
});

router.get('/users/:userId/drafts', protect, (req, res) => {
  res.json({ success: true, data: [] });
});

router.delete('/drafts/:draftId', protect, (req, res) => {
  res.json({ success: true, data: { message: 'Draft deleted.' } });
});

export default router;
