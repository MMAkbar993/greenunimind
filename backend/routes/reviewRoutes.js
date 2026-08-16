import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createOrUpdateReview,
  getMyReviewForCourse,
  getCourseReviews,
  getTeacherReviews,
  getReviewStats,
  getReviewDashboard,
  respondToReview,
  markReviewHelpful,
  reportReview,
  exportReviews,
  getReviewAnalytics,
  getReviewInsights,
  getReviewTrends,
} from '../controllers/reviewController.js';

const router = express.Router();

// Literal-prefixed routes before generic /:reviewId patterns.
router.get('/teacher/:teacherId/stats', protect, getReviewStats);
router.get('/teacher/:teacherId/dashboard', protect, getReviewDashboard);
router.get('/teacher/:teacherId/analytics', protect, getReviewAnalytics);
router.get('/teacher/:teacherId/insights', protect, getReviewInsights);
router.get('/teacher/:teacherId/trends', protect, getReviewTrends);
router.post('/teacher/:teacherId/export', protect, exportReviews);
router.get('/teacher/:teacherId', protect, getTeacherReviews);

router.get('/course/:courseId/mine', protect, getMyReviewForCourse);
router.post('/course/:courseId', protect, createOrUpdateReview);
router.get('/course/:courseId', protect, getCourseReviews);

router.post('/:reviewId/respond', protect, respondToReview);
router.post('/:reviewId/helpful', protect, markReviewHelpful);
router.post('/:reviewId/report', protect, reportReview);

export default router;
