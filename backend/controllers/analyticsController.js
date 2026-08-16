import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Transaction from '../models/Transaction.js';

const protectTeacher = (req, res, next) => {
  const teacherId = req.params.teacherId;
  const currentUserId = req.user?._id?.toString();
  // Must be both the teacher in question AND actually hold the teacher role -
  // previously `&&`, which let any authenticated teacher pull any other
  // teacher's analytics (isMe OR isAnyTeacher, not isMe AND isTeacher).
  if (currentUserId !== teacherId || req.user?.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
};

const percentGrowth = (current, previous) => {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100);
  return current > 0 ? 100 : 0;
};

const performanceLabel = (completionRate) => {
  if (completionRate >= 70) return 'Excellent';
  if (completionRate >= 50) return 'Good';
  if (completionRate >= 30) return 'Average';
  return 'Needs Improvement';
};

const stubDashboard = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const courses = await Course.find({ creator: teacherId }).lean();
    const courseIds = courses.map((c) => c._id);
    const published = courses.filter((c) => c.isPublished && c.status === 'published');

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      enrollments,
      progressRecords,
      earningsAgg,
      monthlyEarningsAgg,
      lastMonthEarningsAgg,
      newStudentsThisMonthUsers,
      newStudentsLastMonthUsers,
      coursesThisMonth,
      coursesLastMonth,
    ] = await Promise.all([
      Progress.countDocuments({ course: { $in: courseIds } }),
      Progress.find({ course: { $in: courseIds } }).select('progress').lean(),
      Transaction.aggregate([
        { $match: { teacher: req.user._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$teacherEarnings' } } },
      ]),
      Transaction.aggregate([
        { $match: { teacher: req.user._id, status: 'completed', createdAt: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$teacherEarnings' } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            teacher: req.user._id,
            status: 'completed',
            createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$teacherEarnings' } } },
      ]),
      Progress.distinct('user', { course: { $in: courseIds }, enrolledAt: { $gte: startOfThisMonth } }),
      Progress.distinct('user', {
        course: { $in: courseIds },
        enrolledAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
      }),
      Course.countDocuments({ creator: teacherId, createdAt: { $gte: startOfThisMonth } }),
      Course.countDocuments({ creator: teacherId, createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
    ]);

    const totalEarnings = earningsAgg[0]?.total || 0;
    const monthlyEarnings = monthlyEarningsAgg[0]?.total || 0;
    const lastMonthEarnings = lastMonthEarningsAgg[0]?.total || 0;
    const completionRate = progressRecords.length
      ? Math.round(progressRecords.reduce((sum, p) => sum + (p.progress || 0), 0) / progressRecords.length)
      : 0;

    const totalReviews = courses.reduce((sum, c) => sum + (c.totalReviews || 0), 0);
    const avgRating = totalReviews
      ? Math.round(
          (courses.reduce((sum, c) => sum + (c.averageRating || 0) * (c.totalReviews || 0), 0) / totalReviews) * 10
        ) / 10
      : 0;

    res.json({
      success: true,
      data: {
        totalCourses: courses.length,
        publishedCourses: published.length,
        draftCourses: courses.length - published.length,
        totalStudents: enrollments,
        totalEarnings,
        avgRating,
        totalReviews,
        monthlyEarnings,
        completionRate,
        newStudentsThisMonth: newStudentsThisMonthUsers.length,
        coursesGrowth: percentGrowth(coursesThisMonth, coursesLastMonth),
        studentsGrowth: percentGrowth(newStudentsThisMonthUsers.length, newStudentsLastMonthUsers.length),
        earningsGrowth: percentGrowth(monthlyEarnings, lastMonthEarnings),
        ratingGrowth: 0,
        completionRateGrowth: 0,
        performanceScore: performanceLabel(completionRate),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch dashboard.' });
  }
};

const stubActivities = async (req, res) => {
  res.json({
    success: true,
    data: {
      activities: [],
      pagination: { offset: parseInt(req.query.offset, 10) || 0, limit: parseInt(req.query.limit, 10) || 10, total: 0 },
      total: 0,
    },
  });
};

const stubInsights = async (req, res) => {
  res.json({
    success: true,
    data: [],
  });
};

const stubEnrollmentStats = async (req, res) => {
  res.json({
    success: true,
    data: {
      totalEnrollments: 0,
      newEnrollments: 0,
      enrollmentTrend: [],
      topCourses: [],
      growthRate: 0,
    },
  });
};

const stubPerformance = async (req, res) => {
  res.json({
    success: true,
    data: {
      averageRating: 0,
      completionRate: 0,
      engagementScore: 0,
      coursePerformance: [],
      trendData: [],
    },
  });
};

const stubRealtime = async (req, res) => {
  res.json({
    success: true,
    data: {
      activeStudents: 0,
      recentEnrollments: [],
      liveActivity: [],
    },
  });
};

const stubEngagement = async (req, res) => {
  res.json({
    success: true,
    data: {
      totalActiveStudents: 0,
      averageEngagementScore: 0,
      completionRates: [],
      timeSpentTrends: [],
      activityPatterns: [],
      retentionRate: 0,
    },
  });
};

const stubRevenue = async (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 0,
      revenueGrowth: 0,
      averageOrderValue: 0,
      paymentTrends: [],
      topEarningCourses: [],
      revenueByPeriod: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
      conversionRate: 0,
      refundRate: 0,
    },
  });
};

const stubStudentEngagement = async (req, res) => {
  res.json({
    success: true,
    data: {
      students: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    },
  });
};

const stubCourseDetails = async (req, res) => {
  res.json({
    success: true,
    data: {
      courses: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    },
  });
};

const stubGeographic = async (req, res) => {
  res.json({ success: true, data: [] });
};

const stubTimeBased = async (req, res) => {
  res.json({ success: true, data: {} });
};

const stubPredictive = async (req, res) => {
  res.json({ success: true, data: {} });
};

const stubBenchmark = async (req, res) => {
  res.json({ success: true, data: {} });
};

const stubWidgets = async (req, res) => {
  res.json({ success: true, data: [] });
};

const stubWidget = async (req, res) => {
  res.json({ success: true, data: null });
};

const stubAlerts = async (req, res) => {
  res.json({ success: true, data: [] });
};

const stubAlert = async (req, res) => {
  res.json({ success: true, data: null });
};

const stubBulkRead = async (req, res) => {
  res.json({ success: true, data: null });
};

const stubExport = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ success: true, data: [] }));
};

export {
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
};
