import Course from '../models/Course.js';
import Progress from '../models/Progress.js';

const protectTeacher = (req, res, next) => {
  const teacherId = req.params.teacherId;
  const currentUserId = req.user?._id?.toString();
  if (currentUserId !== teacherId && req.user?.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
};

const stubDashboard = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const courses = await Course.find({ creator: teacherId }).lean();
    const published = courses.filter((c) => c.isPublished && c.status === 'published');
    const enrollments = await Progress.countDocuments({
      course: { $in: courses.map((c) => c._id) },
    });
    res.json({
      success: true,
      data: {
        totalCourses: courses.length,
        publishedCourses: published.length,
        draftCourses: courses.length - published.length,
        totalStudents: enrollments,
        totalEarnings: 0,
        avgRating: 0,
        monthlyEarnings: 0,
        completionRate: 0,
        newStudentsThisMonth: 0,
        totalReviews: 0,
        coursesGrowth: 0,
        studentsGrowth: 0,
        earningsGrowth: 0,
        ratingGrowth: 0,
        completionRateGrowth: 0,
        performanceScore: 'Average',
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
