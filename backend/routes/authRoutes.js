import express from 'express';
import {
  login,
  logout,
  refreshToken,
  verifyOtp,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getRateLimitStatus,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/verify-otp', verifyOtp);
router.post('/resend-verification', resendVerification);
router.post('/forget-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', protect, changePassword);
router.get('/rate-limit-status', getRateLimitStatus);

router.get('/2fa/setup/:userId', protect, (req, res) => {
  res.json({ success: true, data: { enabled: false, qrCode: null, secret: null } });
});
router.post('/2fa/verify', protect, (req, res) => {
  res.json({ success: true, data: { verified: true } });
});
router.post('/2fa/login-verify', (req, res) => {
  res.json({ success: true, data: { verified: true } });
});
router.post('/2fa/disable', protect, (req, res) => {
  res.json({ success: true, data: { disabled: true } });
});

export default router;
