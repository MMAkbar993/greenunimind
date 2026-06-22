import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  createCheckoutSession,
  createPaymentIntent,
  getTransactionBySessionId,
  handleStripeWebhook,
  getUpcomingPayout,
  getTeacherEarnings,
  getPayoutInfo,
  getTeacherTransactions,
  getPayoutHistory,
  getPayoutPreferences,
  getEarningsGrowth,
  getRevenueChart,
  getFinancialSummary,
  getTopPerformingCourses,
} from '../controllers/paymentController.js';

const router = express.Router();
const teacherAuth = [protect, restrictTo('teacher')];

router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/create-payment-intent', protect, createPaymentIntent);
router.get('/session/:sessionId', protect, getTransactionBySessionId);
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.get('/upcoming-payout/:teacherId', ...teacherAuth, getUpcomingPayout);
router.get('/earnings/:teacherId', ...teacherAuth, getTeacherEarnings);
router.get('/payout-info/:teacherId', ...teacherAuth, getPayoutInfo);
router.get('/transactions/:teacherId', ...teacherAuth, getTeacherTransactions);
router.get('/payouts/:teacherId', ...teacherAuth, getPayoutHistory);
router.get('/payouts/preferences/:teacherId', ...teacherAuth, getPayoutPreferences);
router.get('/earnings-growth/:teacherId', ...teacherAuth, getEarningsGrowth);
router.get('/revenue-chart/:teacherId', ...teacherAuth, getRevenueChart);
router.get('/financial-summary/:teacherId', ...teacherAuth, getFinancialSummary);
router.get('/top-courses/:teacherId', ...teacherAuth, getTopPerformingCourses);

router.get('/transaction/:transactionId', protect, async (req, res) => {
  try {
    const Transaction = (await import('../models/Transaction.js')).default;
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('course', 'title courseThumbnail')
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .lean();
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/student-transactions/:studentId', protect, async (req, res) => {
  try {
    const Transaction = (await import('../models/Transaction.js')).default;
    const transactions = await Transaction.find({ student: req.params.studentId })
      .populate('course', 'title courseThumbnail')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics/:teacherId', ...teacherAuth, (req, res) => {
  res.json({ success: true, data: { daily: [], weekly: [], monthly: [] } });
});

router.get('/teacher-payouts/:teacherId', ...teacherAuth, async (req, res) => {
  try {
    const Transaction = (await import('../models/Transaction.js')).default;
    const mongoose = (await import('mongoose')).default;
    const paidOut = await Transaction.find({
      teacher: new mongoose.Types.ObjectId(req.params.teacherId),
      isPaidOut: true,
    }).sort({ paidOutAt: -1 }).lean();
    res.json({ success: true, data: paidOut });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/payout-request/:teacherId', ...teacherAuth, (req, res) => {
  res.json({ success: true, data: { message: 'Payout request submitted.', status: 'pending' } });
});

router.post('/export/:teacherId', ...teacherAuth, (req, res) => {
  res.json({ success: true, data: [] });
});

router.get('/connect-stripe-url/:teacherId', ...teacherAuth, (req, res) => {
  res.json({ success: true, data: { url: null, message: 'Use Stripe Connect onboarding flow.' } });
});

router.post('/exchange-stripe-code', ...teacherAuth, (req, res) => {
  res.json({ success: true, data: { connected: false, message: 'Use Stripe Connect onboarding flow.' } });
});

router.put('/payouts/preferences/:teacherId', ...teacherAuth, (req, res) => {
  res.json({ success: true, data: { ...req.body, updated: true } });
});

router.get('/payouts/details/:payoutId', ...teacherAuth, (req, res) => {
  res.json({ success: true, data: null });
});

export default router;
