import Review from '../models/Review.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';

const recalculateCourseRating = async (courseId) => {
  const reviews = await Review.find({ course: courseId }).select('rating').lean();
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;
  await Course.findByIdAndUpdate(courseId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
  });
};

const formatReview = (review, viewerId) => ({
  id: review._id,
  studentName: review.student?.name
    ? `${review.student.name.firstName} ${review.student.name.lastName}`.trim()
    : 'Anonymous',
  studentAvatar: review.student?.profileImg,
  courseId: review.course?._id || review.course,
  courseName: review.course?.title || '',
  courseThumbnail: review.course?.courseThumbnail,
  rating: review.rating,
  comment: review.comment,
  helpful: review.helpfulBy?.length || 0,
  isHelpfulByMe: viewerId ? !!review.helpfulBy?.some((id) => id.toString() === viewerId) : false,
  isRespondedTo: !!review.response?.text,
  response: review.response?.text
    ? { text: review.response.text, respondedAt: review.response.respondedAt }
    : null,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const buildPagination = (page, limit, total) => ({
  currentPage: page,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  totalReviews: total,
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

/**
 * Student creates or edits their review for a course they're enrolled in.
 * POST /api/reviews/course/:courseId
 */
export const createOrUpdateReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user._id;

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const enrolled = await Progress.exists({ user: studentId, course: courseId });
    if (!enrolled) {
      return res
        .status(403)
        .json({ success: false, message: 'You must be enrolled in this course to review it.' });
    }

    const course = await Course.findById(courseId).select('creator').lean();
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const review = await Review.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        $set: {
          rating: ratingNum,
          comment: comment?.trim() || '',
          teacher: course.creator,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await recalculateCourseRating(courseId);

    res.status(201).json({ success: true, data: formatReview(review, studentId.toString()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to save review.' });
  }
};

/**
 * GET /api/reviews/course/:courseId/mine
 */
export const getMyReviewForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const review = await Review.findOne({ student: req.user._id, course: courseId }).lean();
    res.json({ success: true, data: review ? formatReview(review, req.user._id.toString()) : null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch your review.' });
  }
};

/**
 * GET /api/reviews/course/:courseId
 */
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));

    const total = await Review.countDocuments({ course: courseId });
    const reviews = await Review.find({ course: courseId })
      .populate('student', 'name profileImg')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const course = await Course.findById(courseId).select('averageRating totalReviews').lean();

    res.json({
      success: true,
      data: {
        reviews: reviews.map((r) => formatReview(r, req.user?._id?.toString())),
        pagination: buildPagination(page, limit, total),
        averageRating: course?.averageRating || 0,
        totalReviews: course?.totalReviews || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch course reviews.' });
  }
};

const buildTeacherReviewFilter = (teacherId, query) => {
  const filter = { teacher: teacherId };
  if (query.courseId) filter.course = query.courseId;
  if (query.rating) {
    const ratings = String(query.rating).split(',').map(Number).filter(Boolean);
    if (ratings.length) filter.rating = { $in: ratings };
  }
  if (query.search) {
    filter.comment = { $regex: String(query.search), $options: 'i' };
  }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }
  return filter;
};

/**
 * GET /api/reviews/teacher/:teacherId
 */
export const getTeacherReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user._id.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const filter = buildTeacherReviewFilter(teacherId, req.query);

    const sortField = req.query.sortBy === 'rating' ? 'rating' : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('student', 'name profileImg')
      .populate('course', 'title courseThumbnail')
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        reviews: reviews.map((r) => formatReview(r)),
        pagination: buildPagination(page, limit, total),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch reviews.' });
  }
};

/**
 * GET /api/reviews/teacher/:teacherId/stats
 */
export const getReviewStats = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user._id.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const reviews = await Review.find({ teacher: teacherId }).select('rating response createdAt').lean();
    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (ratingDistribution[r.rating] !== undefined) ratingDistribution[r.rating] += 1;
    });

    const responded = reviews.filter((r) => r.response?.text).length;
    const responseRate = totalReviews ? Math.round((responded / totalReviews) * 100) : 0;

    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - 7);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const recentReviews = reviews.filter((r) => new Date(r.createdAt) >= startOfThisWeek).length;
    const thisMonthCount = reviews.filter((r) => new Date(r.createdAt) >= startOfThisMonth).length;
    const lastMonthCount = reviews.filter(
      (r) => new Date(r.createdAt) >= startOfLastMonth && new Date(r.createdAt) < startOfThisMonth
    ).length;
    const monthlyGrowth = lastMonthCount > 0
      ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
      : (thisMonthCount > 0 ? 100 : 0);

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        recentReviews,
        responseRate,
        // No sentiment-analysis model is wired up, so this stays neutral
        // rather than faking a score.
        sentimentScore: 0,
        monthlyGrowth,
        weeklyGrowth: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch review stats.' });
  }
};

/**
 * GET /api/reviews/teacher/:teacherId/dashboard
 */
export const getReviewDashboard = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user._id.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const reviews = await Review.find({ teacher: teacherId })
      .populate('student', 'name profileImg')
      .populate('course', 'title courseThumbnail')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const total = await Review.countDocuments({ teacher: teacherId });
    const allRatings = await Review.find({ teacher: teacherId }).select('rating').lean();
    const averageRating = allRatings.length
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

    res.json({
      success: true,
      data: {
        reviews: {
          reviews: reviews.map((r) => formatReview(r)),
          pagination: buildPagination(1, 10, total),
        },
        analytics: {
          stats: {
            totalReviews: total,
            averageRating: Math.round(averageRating * 10) / 10,
          },
          trends: [],
          topCourses: [],
          recentActivity: [],
          ratingTrends: [],
        },
        insights: [],
        notifications: { unreadCount: 0, recent: [] },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch review dashboard.' });
  }
};

/**
 * POST /api/reviews/:reviewId/respond
 */
export const respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    if (!response?.trim()) {
      return res.status(400).json({ success: false, message: 'Response text is required.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    if (review.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    review.response = { text: response.trim(), respondedAt: new Date() };
    await review.save();

    const populated = await Review.findById(reviewId)
      .populate('student', 'name profileImg')
      .populate('course', 'title courseThumbnail')
      .lean();

    res.json({ success: true, data: formatReview(populated) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to respond to review.' });
  }
};

/**
 * POST /api/reviews/:reviewId/helpful
 */
export const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const userId = req.user._id.toString();
    const alreadyMarked = review.helpfulBy.some((id) => id.toString() === userId);
    if (alreadyMarked) {
      review.helpfulBy = review.helpfulBy.filter((id) => id.toString() !== userId);
    } else {
      review.helpfulBy.push(req.user._id);
    }
    await review.save();

    res.json({ success: true, data: { success: true, helpful: review.helpfulBy.length, isHelpfulByMe: !alreadyMarked } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update review.' });
  }
};

/**
 * POST /api/reviews/:reviewId/report
 */
export const reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    review.reportedBy.push({ user: req.user._id, reason: reason || '' });
    await review.save();

    res.json({ success: true, data: { success: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to report review.' });
  }
};

const csvEscape = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

/**
 * GET /api/reviews/teacher/:teacherId/export
 */
export const exportReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user._id.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const reviews = await Review.find({ teacher: teacherId })
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const columns = [
      { label: 'Date', value: (r) => new Date(r.createdAt).toISOString().split('T')[0] },
      { label: 'Course', value: (r) => r.course?.title || '' },
      {
        label: 'Student',
        value: (r) => `${r.student?.name?.firstName || ''} ${r.student?.name?.lastName || ''}`.trim(),
      },
      { label: 'Rating', value: (r) => r.rating },
      { label: 'Comment', value: (r) => r.comment },
      { label: 'Responded', value: (r) => (r.response?.text ? 'Yes' : 'No') },
    ];

    const header = columns.map((c) => csvEscape(c.label)).join(',');
    const body = reviews.map((r) => columns.map((c) => csvEscape(c.value(r))).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reviews_${Date.now()}.csv"`);
    res.send(`${header}\n${body}`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to export reviews.' });
  }
};

/**
 * Not wired to any UI yet (Reviews.tsx's Analytics/Insights tabs show static
 * "coming soon" copy rather than calling these) - kept honest and minimal.
 * GET /api/reviews/teacher/:teacherId/analytics
 */
export const getReviewAnalytics = async (req, res) => {
  res.json({
    success: true,
    data: { stats: null, trends: [], topCourses: [], recentActivity: [], ratingTrends: [] },
  });
};

/** GET /api/reviews/teacher/:teacherId/insights */
export const getReviewInsights = async (_req, res) => {
  res.json({ success: true, data: [] });
};

/** GET /api/reviews/teacher/:teacherId/trends */
export const getReviewTrends = async (_req, res) => {
  res.json({ success: true, data: [] });
};
