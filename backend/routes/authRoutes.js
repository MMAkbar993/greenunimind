import express from 'express';
import {
  login,
  googleLogin,
  logout,
  refreshToken,
  verifyOtp,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getRateLimitStatus,
  setupTwoFactor,
  verifyTwoFactor,
  verifyLoginTwoFactor,
  disableTwoFactor,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/verify-otp', verifyOtp);
router.post('/resend-verification', resendVerification);
router.post('/forget-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', protect, changePassword);
router.get('/rate-limit-status', getRateLimitStatus);

router.get('/2fa/setup/:userId', protect, setupTwoFactor);
router.post('/2fa/verify', protect, verifyTwoFactor);
router.post('/2fa/login-verify', verifyLoginTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);

export default router;
