import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  protectTeacher,
  stubDashboard,
  stubActivities,
  stubInsights,
  stubEnrollmentStats,
  stubPerformance,
  stubRealtime,
  stubEngagement,
  stubRevenue,
  stubStudentEngagement,
  stubCourseDetails,
  stubGeographic,
  stubTimeBased,
  stubPredictive,
  stubBenchmark,
  stubWidgets,
  stubWidget,
  stubAlerts,
  stubAlert,
  stubBulkRead,
  stubExport,
} from '../controllers/analyticsController.js';

const router = express.Router();

const teacherMiddleware = [protect, protectTeacher];

router.get('/teachers/:teacherId/dashboard', ...teacherMiddleware, stubDashboard);
router.get('/teachers/:teacherId/activities', ...teacherMiddleware, stubActivities);
router.patch('/teachers/:teacherId/activities/bulk-read', ...teacherMiddleware, stubBulkRead);
router.get('/teachers/:teacherId/insights', ...teacherMiddleware, stubInsights);
router.get('/teachers/:teacherId/enrollment-statistics', ...teacherMiddleware, stubEnrollmentStats);
router.get('/teachers/:teacherId/performance-detailed', ...teacherMiddleware, stubPerformance);
router.get('/teachers/:teacherId/realtime', ...teacherMiddleware, stubRealtime);
router.get('/teachers/:teacherId/engagement-metrics', ...teacherMiddleware, stubEngagement);
router.get('/teachers/:teacherId/revenue-detailed', ...teacherMiddleware, stubRevenue);
router.get('/teachers/:teacherId/student-engagement', ...teacherMiddleware, stubStudentEngagement);
router.get('/teachers/:teacherId/course-details', ...teacherMiddleware, stubCourseDetails);
router.get('/teachers/:teacherId/geographic', ...teacherMiddleware, stubGeographic);
router.get('/teachers/:teacherId/time-based', ...teacherMiddleware, stubTimeBased);
router.get('/teachers/:teacherId/predictive', ...teacherMiddleware, stubPredictive);
router.get('/teachers/:teacherId/benchmark', ...teacherMiddleware, stubBenchmark);
router.get('/teachers/:teacherId/widgets', ...teacherMiddleware, stubWidgets);
router.get('/teachers/:teacherId/widgets/:widgetId', ...teacherMiddleware, stubWidget);
router.post('/teachers/:teacherId/widgets', ...teacherMiddleware, (req, res) => {
  res.status(201).json({ success: true, data: { _id: Date.now().toString(), ...req.body } });
});
router.put('/teachers/:teacherId/widgets/:widgetId', ...teacherMiddleware, (req, res) => {
  res.json({ success: true, data: { _id: req.params.widgetId, ...req.body } });
});
router.delete('/teachers/:teacherId/widgets/:widgetId', ...teacherMiddleware, (req, res) => {
  res.json({ success: true, data: { message: 'Widget deleted.' } });
});
router.get('/teachers/:teacherId/alerts', ...teacherMiddleware, stubAlerts);
router.get('/teachers/:teacherId/alerts/:ruleId', ...teacherMiddleware, stubAlert);
router.post('/teachers/:teacherId/alerts', ...teacherMiddleware, (req, res) => {
  res.status(201).json({ success: true, data: { _id: Date.now().toString(), ...req.body } });
});
router.put('/teachers/:teacherId/alerts/:ruleId', ...teacherMiddleware, (req, res) => {
  res.json({ success: true, data: { _id: req.params.ruleId, ...req.body } });
});
router.delete('/teachers/:teacherId/alerts/:ruleId', ...teacherMiddleware, (req, res) => {
  res.json({ success: true, data: { message: 'Alert rule deleted.' } });
});
router.post('/teachers/:teacherId/export', ...teacherMiddleware, stubExport);

export default router;
