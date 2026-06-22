import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:studentId', protect, (req, res) => {
  res.status(201).json({ success: true, data: { _id: Date.now().toString(), ...req.body, createdAt: new Date() } });
});

router.get('/:lectureId/:studentId', protect, (req, res) => {
  res.json({ success: true, data: null });
});

router.delete('/:id', protect, (req, res) => {
  res.json({ success: true, data: { message: 'Note deleted.' } });
});

router.get('/shared/:lectureId', protect, (req, res) => {
  res.json({ success: true, data: [] });
});

router.post('/share/:noteId', protect, (req, res) => {
  res.json({ success: true, data: { shared: true } });
});

export default router;
