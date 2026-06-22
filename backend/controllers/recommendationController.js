import Course from '../models/Course.js';
import Progress from '../models/Progress.js';

const DEFAULT_LIMIT = 6;

/**
 * Get personalized course recommendations based on user behavior.
 * Uses: enrolled courses, completed courses, categories, course level.
 * GET /api/recommendations (requires auth) or GET /api/recommendations?userId= (for students)
 */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.query.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 20);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Login required for personalized recommendations.',
      });
    }

    const progressList = await Progress.find({ user: userId })
      .populate('course', 'category subcategory courseLevel title')
      .lean();

    const enrolledCourseIds = progressList
      .filter((p) => p.course)
      .map((p) => p.course._id.toString());
    const categories = [...new Set(progressList.map((p) => p.course?.category).filter(Boolean))];
    const levels = [...new Set(progressList.map((p) => p.course?.courseLevel).filter(Boolean))];
    const preferredLevel = levels[0] || 'Beginner';

    const filter = {
      isPublished: true,
      status: 'published',
      _id: { $nin: enrolledCourseIds.map((id) => id) },
    };

    let courses = [];
    if (categories.length > 0) {
      courses = await Course.find({
        ...filter,
        $or: [
          { category: { $in: categories } },
          { courseLevel: preferredLevel },
        ],
      })
        .sort({ totalEnrollment: -1, createdAt: -1 })
        .limit(limit * 2)
        .lean();
    }

    if (courses.length < limit) {
      const extra = await Course.find({
        ...filter,
        _id: { $nin: courses.map((c) => c._id) },
      })
        .sort({ totalEnrollment: -1 })
        .limit(limit - courses.length)
        .lean();
      courses = [...courses, ...extra];
    }

    const recommended = courses.slice(0, limit);

    res.json({
      success: true,
      data: {
        recommendations: recommended,
        basedOn: {
          categories: categories.slice(0, 3),
          level: preferredLevel,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch recommendations.',
    });
  }
};
