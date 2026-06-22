import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/link', protect, (req, res) => {
  res.json({ success: true, data: { message: 'OAuth account linked.', provider: req.body.provider } });
});

router.post('/unlink', protect, (req, res) => {
  res.json({ success: true, data: { message: 'OAuth account unlinked.', provider: req.body.provider } });
});

export default router;
