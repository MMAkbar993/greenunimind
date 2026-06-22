import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';

/**
 * Get start/end of month in UTC.
 */
function getMonthBounds(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

/**
 * Get monthly impact report.
 * GET /api/impact/report?year=2025&month=2
 * Public endpoint - returns aggregated platform metrics.
 */
export const getMonthlyImpactReport = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month. Use 1-12.',
      });
    }

    const { start, end } = getMonthBounds(year, month);

    // New enrollments this month
    const newEnrollments = await Progress.countDocuments({
      enrolledAt: { $gte: start, $lte: end },
    });

    // New courses created this month
    const newCoursesPublished = await Course.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    // Certificates generated this month (progress updated to certificateGenerated=true)
    const certificatesIssued = await Progress.countDocuments({
      certificateGenerated: true,
      updatedAt: { $gte: start, $lte: end },
    });

    // Total students (users with role student)
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Total teachers
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    // Total published courses
    const totalPublishedCourses = await Course.countDocuments({
      isPublished: true,
      status: 'published',
    });

    // Total enrollments (all time)
    const totalEnrollments = await Progress.countDocuments();

    // Lectures completed this month (aggregate from lectureProgress updates)
    const progressWithCompletions = await Progress.aggregate([
      { $unwind: '$lectureProgress' },
      {
        $match: {
          'lectureProgress.isCompleted': true,
          'lectureProgress.lastUpdated': { $gte: start, $lte: end },
        },
      },
      { $count: 'count' },
    ]);
    const lecturesCompletedThisMonth = progressWithCompletions[0]?.count ?? 0;

    // Total watch time this month (minutes) - approximate from progress updates
    const watchTimeData = await Progress.aggregate([
      { $unwind: '$lectureProgress' },
      {
        $match: {
          'lectureProgress.lastUpdated': { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: { $divide: ['$lectureProgress.watchTime', 60] } },
        },
      },
    ]);
    const watchTimeMinutes = Math.round(watchTimeData[0]?.totalMinutes ?? 0);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    res.json({
      success: true,
      data: {
        period: {
          year,
          month,
          label: `${monthNames[month - 1]} ${year}`,
        },
        // This month
        newEnrollments,
        newCoursesPublished,
        certificatesIssued,
        lecturesCompletedThisMonth,
        watchTimeMinutes,
        // All-time
        totalStudents,
        totalTeachers,
        totalPublishedCourses,
        totalEnrollments,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch impact report.',
    });
  }
};

/**
 * Get monthly report in documentation format.
 * GET /api/reports/monthly?year=2025&month=2
 * Docs format: { educators, teachersHired, coursesCompleted, revenue, fundsToGreenInitiatives }
 */
export const getMonthlyReportDocsFormat = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month. Use 1-12.',
      });
    }

    const { start, end } = getMonthBounds(year, month);

    const [educators, teachersHired, coursesCompleted] = await Promise.all([
      Progress.countDocuments({ enrolledAt: { $gte: start, $lte: end } }),
      User.countDocuments({
        role: 'teacher',
        createdAt: { $gte: start, $lte: end },
      }),
      Progress.countDocuments({
        certificateGenerated: true,
        updatedAt: { $gte: start, $lte: end },
      }),
    ]);

    let totalRevenue = 0;
    try {
      const Revenue = (await import('../models/Revenue.js')).default;
      const revenueData = await Revenue.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      totalRevenue = revenueData[0]?.total ?? 0;
    } catch {
      totalRevenue = 0;
    }
    const fundsToGreenInitiatives = totalRevenue * 0.25;

    res.json({
      success: true,
      data: {
        educators,
        teachersHired,
        coursesCompleted,
        revenue: `$${totalRevenue.toFixed(2)}`,
        fundsToGreenInitiatives: `$${fundsToGreenInitiatives.toFixed(2)}`,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch monthly report.',
    });
  }
};

/**
 * Get available months for report.
 * GET /api/impact/available-months
 */
export const getAvailableMonths = async (req, res) => {
  try {
    const months = await Progress.aggregate([
      { $project: { year: { $year: '$enrolledAt' }, month: { $month: '$enrolledAt' } } },
      { $group: { _id: { year: '$year', month: '$month' } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 24 },
    ]);

    const courseMonths = await Course.aggregate([
      { $match: { isPublished: true, status: 'published' } },
      { $project: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } } },
      { $group: { _id: { year: '$year', month: '$month' } } },
    ]);

    const allMonths = new Map();
    months.forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      allMonths.set(key, { year: m._id.year, month: m._id.month });
    });
    courseMonths.forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      if (!allMonths.has(key)) allMonths.set(key, { year: m._id.year, month: m._id.month });
    });

    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    if (!allMonths.has(currentKey)) {
      allMonths.set(currentKey, { year: now.getFullYear(), month: now.getMonth() + 1 });
    }

    const sorted = Array.from(allMonths.values())
      .sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month))
      .slice(0, 24);

    res.json({ success: true, data: sorted });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch available months.',
    });
  }
};
