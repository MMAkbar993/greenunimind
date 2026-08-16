import Stripe from 'stripe';
import Course from '../models/Course.js';
import Transaction from '../models/Transaction.js';
import Revenue from '../models/Revenue.js';
import Teacher from '../models/Teacher.js';

const PLATFORM_FEE_PERCENT = 20;
const TEACHER_SHARE_PERCENT = 100 - PLATFORM_FEE_PERCENT;

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const protectTeacher = (req, res, next) => {
  const teacherId = req.params.teacherId;
  const currentUserId = req.user?._id?.toString();
  if (currentUserId !== teacherId) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { courseId, amount } = req.body;
    const studentId = req.user._id;

    const course = await Course.findById(courseId).populate('creator', 'name email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (course.isFree === 'true' || course.coursePrice === 0) {
      return res.status(400).json({ success: false, message: 'This is a free course. Enroll directly.' });
    }

    const alreadyEnrolled = (course.enrolledStudents || []).some(
      (id) => id.toString() === studentId.toString()
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course.' });
    }

    const stripe = getStripe();
    if (!stripe) {
      const transaction = await Transaction.create({
        student: studentId,
        course: courseId,
        teacher: course.creator._id || course.creator,
        amount: amount || course.coursePrice,
        status: 'completed',
        paymentMethod: 'stripe',
        teacherEarnings: ((amount || course.coursePrice) * TEACHER_SHARE_PERCENT) / 100,
        platformFee: ((amount || course.coursePrice) * PLATFORM_FEE_PERCENT) / 100,
        stripeSessionId: `dev_session_${Date.now()}`,
      });

      return res.json({
        success: true,
        data: {
          sessionId: transaction.stripeSessionId,
          url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/payment-success?session_id=${transaction.stripeSessionId}`,
          message: 'Stripe not configured. Dev mode: transaction created directly.',
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.subtitle || course.description?.substring(0, 200),
            },
            unit_amount: Math.round((amount || course.coursePrice) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        courseId: courseId.toString(),
        studentId: studentId.toString(),
        teacherId: (course.creator._id || course.creator).toString(),
      },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/payment-cancel`,
    });

    await Transaction.create({
      student: studentId,
      course: courseId,
      teacher: course.creator._id || course.creator,
      amount: amount || course.coursePrice,
      status: 'pending',
      stripeSessionId: session.id,
      teacherEarnings: ((amount || course.coursePrice) * TEACHER_SHARE_PERCENT) / 100,
      platformFee: ((amount || course.coursePrice) * PLATFORM_FEE_PERCENT) / 100,
    });

    res.json({
      success: true,
      data: { sessionId: session.id, url: session.url },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create checkout session.' });
  }
};

export const createPaymentIntent = async (req, res) => {
  try {
    const { studentId, courseId, amount } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.json({
        success: true,
        data: {
          clientSecret: `dev_secret_${Date.now()}`,
          amount: amount || course.coursePrice,
          message: 'Stripe not configured. Use checkout session instead.',
        },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round((amount || course.coursePrice) * 100),
      currency: 'usd',
      metadata: {
        courseId: courseId.toString(),
        studentId: (studentId || req.user._id).toString(),
        teacherId: course.creator.toString(),
      },
    });

    res.json({
      success: true,
      data: { clientSecret: paymentIntent.client_secret, amount: amount || course.coursePrice },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create payment intent.' });
  }
};

export const getTransactionBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const transaction = await Transaction.findOne({ stripeSessionId: sessionId })
      .populate('course', 'title subtitle courseThumbnail')
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .lean();

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch transaction.' });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(400).json({ success: false, message: 'Stripe not configured.' });
  }

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { courseId, studentId, teacherId } = session.metadata;

    const transaction = await Transaction.findOne({ stripeSessionId: session.id });
    if (transaction && transaction.status !== 'completed') {
      transaction.status = 'completed';
      transaction.stripePaymentIntentId = session.payment_intent;
      await transaction.save();

      const Progress = (await import('../models/Progress.js')).default;
      const Lecture = (await import('../models/Lecture.js')).default;

      const course = await Course.findById(courseId);
      if (course && !course.enrolledStudents.includes(studentId)) {
        course.enrolledStudents.push(studentId);
        course.totalEnrollment = (course.totalEnrollment || 0) + 1;
        await course.save();

        const lectureCount = await Lecture.countDocuments({ courseId });
        const totalDuration = await Lecture.aggregate([
          { $match: { courseId: course._id } },
          { $group: { _id: null, total: { $sum: '$duration' } } },
        ]);

        await Progress.create({
          user: studentId,
          course: courseId,
          completedLectures: [],
          progress: 0,
          totalLectures: lectureCount,
          totalDuration: totalDuration[0]?.total || 0,
          watchedDuration: 0,
        });
      }

      await Revenue.create({
        source: 'course',
        amount: transaction.amount,
        description: `Course purchase: ${course?.title || courseId}`,
        metadata: {
          courseId,
          userId: studentId,
          teacherId,
          stripePaymentId: session.payment_intent,
        },
      });

      // Best-effort: auto-email the invoice if the teacher hasn't opted out.
      // Wrapped so a mail failure never fails the webhook (Stripe would retry
      // the whole event, re-running the enrollment logic above).
      try {
        const teacherDoc = await Teacher.findOne({ user: teacherId }).lean();
        if (teacherDoc?.invoicePreferences?.emailNotificationsEnabled !== false) {
          const { ensureInvoiceForTransaction } = await import('./invoiceController.js');
          const { sendInvoiceEmail } = await import('../utils/email.js');
          const student = await (await import('../models/User.js')).default.findById(studentId).select('email');

          const invoice = await ensureInvoiceForTransaction(transaction._id);
          if (invoice && student?.email) {
            await sendInvoiceEmail(student.email, {
              invoiceNumber: invoice.invoiceNumber,
              courseTitle: course?.title || 'Course',
              amount: invoice.amount,
              currency: invoice.currency,
            });
            invoice.emailSentCount += 1;
            invoice.lastEmailSentAt = new Date();
            await invoice.save();
          }
        }
      } catch (emailErr) {
        console.error('Auto invoice email failed:', emailErr.message);
      }
    }
  }

  res.json({ received: true });
};

export const getTeacherEarnings = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const transactions = await Transaction.find({
      teacher: teacherId,
      status: 'completed',
    }).lean();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalEarnings = 0, monthlyEarnings = 0, weeklyEarnings = 0, dailyEarnings = 0;

    for (const t of transactions) {
      totalEarnings += t.teacherEarnings || 0;
      if (t.createdAt >= startOfMonth) monthlyEarnings += t.teacherEarnings || 0;
      if (t.createdAt >= startOfWeek) weeklyEarnings += t.teacherEarnings || 0;
      if (t.createdAt >= startOfDay) dailyEarnings += t.teacherEarnings || 0;
    }

    res.json({
      success: true,
      data: {
        totalEarnings,
        monthlyEarnings,
        weeklyEarnings,
        dailyEarnings,
        totalCoursesSold: transactions.length,
        avgPerCourse: transactions.length > 0 ? totalEarnings / transactions.length : 0,
        transactions: transactions.slice(-10).reverse(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch earnings.' });
  }
};

export const getUpcomingPayout = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const unpaidTotal = await Transaction.aggregate([
      { $match: { teacher: new (await import('mongoose')).default.Types.ObjectId(teacherId), status: 'completed', isPaidOut: false } },
      { $group: { _id: null, total: { $sum: '$teacherEarnings' } } },
    ]);

    const amount = unpaidTotal[0]?.total || 0;

    res.json({
      success: true,
      data: {
        amount,
        currency: 'USD',
        expectedDate: amount > 0 ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) : null,
        status: amount > 0 ? 'scheduled' : 'none',
        payoutSchedule: {
          interval: 'monthly',
          monthlyAnchor: 1,
          weeklyAnchor: null,
          delayDays: 2,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch upcoming payout.' });
  }
};

export const getPayoutInfo = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const unpaidTotal = await Transaction.aggregate([
      { $match: { teacher: new (await import('mongoose')).default.Types.ObjectId(teacherId), status: 'completed', isPaidOut: false } },
      { $group: { _id: null, total: { $sum: '$teacherEarnings' } } },
    ]);

    const monthlyBreakdown = await Transaction.aggregate([
      { $match: { teacher: new (await import('mongoose')).default.Types.ObjectId(teacherId), status: 'completed' } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        earnings: { $sum: '$teacherEarnings' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    const now = new Date();
    res.json({
      success: true,
      data: {
        currentPeriod: {
          month: now.toLocaleString('default', { month: 'long' }),
          year: now.getFullYear().toString(),
          earnings: monthlyBreakdown[0]?.earnings || 0,
        },
        monthlyBreakdown: monthlyBreakdown.map((m) => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          earnings: m.earnings,
          transactions: m.count,
        })),
        availableBalance: unpaidTotal[0]?.total || 0,
        pendingBalance: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch payout info.' });
  }
};

export const getTeacherTransactions = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const transactions = await Transaction.find({ teacher: teacherId })
      .populate('course', 'title courseThumbnail')
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch transactions.' });
  }
};

export const getPayoutHistory = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const paidTransactions = await Transaction.find({
      teacher: teacherId,
      isPaidOut: true,
    }).sort({ paidOutAt: -1 }).lean();

    res.json({ success: true, data: paidTransactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch payout history.' });
  }
};

export const getPayoutPreferences = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await Teacher.findOne({ user: teacherId }).lean();

    res.json({
      success: true,
      data: {
        stripeConnected: !!teacher?.stripeAccountId,
        payoutMethod: teacher?.stripeAccountId ? 'stripe' : null,
        schedule: teacher?.payoutPreferences?.schedule || 'monthly',
        minimumAmount: teacher?.payoutPreferences?.minimumAmount || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch payout preferences.' });
  }
};

/**
 * PUT /payments/payouts/preferences/:teacherId
 */
export const updatePayoutPreferences = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { schedule, minimumAmount } = req.body;

    const update = {};
    if (schedule && ['weekly', 'biweekly', 'monthly'].includes(schedule)) {
      update['payoutPreferences.schedule'] = schedule;
    }
    if (minimumAmount !== undefined && !Number.isNaN(Number(minimumAmount))) {
      update['payoutPreferences.minimumAmount'] = Math.max(0, Number(minimumAmount));
    }

    const teacher = await Teacher.findOneAndUpdate(
      { user: teacherId },
      { $set: update },
      { new: true }
    ).lean();

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    res.json({
      success: true,
      data: {
        schedule: teacher.payoutPreferences?.schedule || 'monthly',
        minimumAmount: teacher.payoutPreferences?.minimumAmount || 0,
        updated: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update payout preferences.' });
  }
};

/**
 * POST /payments/payout-request/:teacherId
 */
export const createPayoutRequest = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { amount } = req.body;

    const requestedAmount = Number(amount);
    if (!requestedAmount || requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid payout amount is required.' });
    }

    const mongoose = (await import('mongoose')).default;
    const unpaidTotal = await Transaction.aggregate([
      { $match: { teacher: new mongoose.Types.ObjectId(teacherId), status: 'completed', isPaidOut: false } },
      { $group: { _id: null, total: { $sum: '$teacherEarnings' } } },
    ]);
    const availableBalance = unpaidTotal[0]?.total || 0;

    if (requestedAmount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Requested amount exceeds available balance of $${availableBalance.toFixed(2)}.`,
      });
    }

    const PayoutRequest = (await import('../models/PayoutRequest.js')).default;
    const payoutRequest = await PayoutRequest.create({
      teacher: teacherId,
      amount: requestedAmount,
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Payout request submitted.',
        status: payoutRequest.status,
        requestId: payoutRequest._id,
        amount: payoutRequest.amount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to submit payout request.' });
  }
};

export const getEarningsGrowth = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { period = '12m' } = req.query;
    const mongoose = (await import('mongoose')).default;

    const months = parseInt(period) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const growth = await Transaction.aggregate([
      { $match: { teacher: new mongoose.Types.ObjectId(teacherId), status: 'completed', createdAt: { $gte: startDate } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        earnings: { $sum: '$teacherEarnings' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        growth: growth.map((g) => ({
          period: `${g._id.year}-${String(g._id.month).padStart(2, '0')}`,
          earnings: g.earnings,
          transactions: g.count,
        })),
        period,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch earnings growth.' });
  }
};

export const getRevenueChart = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { period = '30d', groupBy = 'day' } = req.query;
    const mongoose = (await import('mongoose')).default;

    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let grouping;
    if (groupBy === 'month') {
      grouping = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    } else if (groupBy === 'week') {
      grouping = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
    } else {
      grouping = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
    }

    const chart = await Transaction.aggregate([
      { $match: { teacher: new mongoose.Types.ObjectId(teacherId), status: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: grouping, revenue: { $sum: '$teacherEarnings' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.json({
      success: true,
      data: chart.map((c) => ({
        date: c._id.day
          ? `${c._id.year}-${String(c._id.month).padStart(2, '0')}-${String(c._id.day).padStart(2, '0')}`
          : `${c._id.year}-${String(c._id.month || c._id.week).padStart(2, '0')}`,
        revenue: c.revenue,
        transactions: c.count,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch revenue chart.' });
  }
};

export const getFinancialSummary = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const mongoose = (await import('mongoose')).default;

    const now = new Date();
    const ranges = {
      daily: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      weekly: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      monthly: new Date(now.getFullYear(), now.getMonth(), 1),
      yearly: new Date(now.getFullYear(), 0, 1),
    };

    const results = {};
    for (const [key, startDate] of Object.entries(ranges)) {
      const agg = await Transaction.aggregate([
        { $match: { teacher: new mongoose.Types.ObjectId(teacherId), status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$teacherEarnings' } } },
      ]);
      results[key] = agg[0]?.total || 0;
    }

    const total = await Transaction.aggregate([
      { $match: { teacher: new mongoose.Types.ObjectId(teacherId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$teacherEarnings' } } },
    ]);

    res.json({
      success: true,
      data: {
        total: total[0]?.total || 0,
        monthly: results.monthly,
        weekly: results.weekly,
        daily: results.daily,
        growth: {
          yearly: results.yearly,
          monthly: results.monthly,
          weekly: results.weekly,
          daily: results.daily,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch financial summary.' });
  }
};

export const getTopPerformingCourses = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { limit = 10 } = req.query;
    const mongoose = (await import('mongoose')).default;

    const topCourses = await Transaction.aggregate([
      { $match: { teacher: new mongoose.Types.ObjectId(teacherId), status: 'completed' } },
      { $group: {
        _id: '$course',
        totalRevenue: { $sum: '$teacherEarnings' },
        totalSales: { $sum: 1 },
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course',
      }},
      { $unwind: '$course' },
    ]);

    res.json({
      success: true,
      data: topCourses.map((c) => ({
        courseId: c._id,
        title: c.course.title,
        thumbnail: c.course.courseThumbnail,
        totalRevenue: c.totalRevenue,
        totalSales: c.totalSales,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch top courses.' });
  }
};

const csvEscape = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const toCsv = (rows, columns) => {
  const header = columns.map((c) => csvEscape(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => csvEscape(c.value(row))).join(',')).join('\n');
  return `${header}\n${body}`;
};

/**
 * GET /payments/analytics-preferences/:teacherId
 */
export const getAnalyticsPreferences = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await Teacher.findOne({ user: teacherId }).lean();
    res.json({
      success: true,
      data: {
        realtimeUpdatesEnabled: teacher?.analyticsPreferences?.realtimeUpdatesEnabled ?? true,
        weeklyEmailReports: teacher?.analyticsPreferences?.weeklyEmailReports ?? false,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch analytics preferences.' });
  }
};

/**
 * PUT /payments/analytics-preferences/:teacherId
 */
export const updateAnalyticsPreferences = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { realtimeUpdatesEnabled, weeklyEmailReports } = req.body;

    const update = {};
    if (realtimeUpdatesEnabled !== undefined)
      update['analyticsPreferences.realtimeUpdatesEnabled'] = !!realtimeUpdatesEnabled;
    if (weeklyEmailReports !== undefined)
      update['analyticsPreferences.weeklyEmailReports'] = !!weeklyEmailReports;

    const teacher = await Teacher.findOneAndUpdate(
      { user: teacherId },
      { $set: update },
      { new: true }
    ).lean();

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    res.json({
      success: true,
      data: {
        realtimeUpdatesEnabled: teacher.analyticsPreferences?.realtimeUpdatesEnabled ?? true,
        weeklyEmailReports: teacher.analyticsPreferences?.weeklyEmailReports ?? false,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update analytics preferences.' });
  }
};

/**
 * GET /payments/export/:teacherId?type=transactions|payouts&format=csv
 */
export const exportFinancialData = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const type = req.query.type || 'transactions';

    let rows;
    let columns;
    let filename;

    if (type === 'payouts') {
      rows = await Transaction.find({ teacher: teacherId, isPaidOut: true })
        .populate('course', 'title')
        .sort({ paidOutAt: -1 })
        .lean();
      columns = [
        { label: 'Date', value: (r) => (r.paidOutAt ? new Date(r.paidOutAt).toISOString().split('T')[0] : '') },
        { label: 'Course', value: (r) => r.course?.title || '' },
        { label: 'Amount', value: (r) => r.teacherEarnings },
        { label: 'Currency', value: (r) => r.currency },
      ];
      filename = 'payouts';
    } else {
      rows = await Transaction.find({ teacher: teacherId })
        .populate('course', 'title')
        .populate('student', 'name email')
        .sort({ createdAt: -1 })
        .lean();
      columns = [
        { label: 'Date', value: (r) => new Date(r.createdAt).toISOString().split('T')[0] },
        { label: 'Course', value: (r) => r.course?.title || '' },
        {
          label: 'Student',
          value: (r) => `${r.student?.name?.firstName || ''} ${r.student?.name?.lastName || ''}`.trim(),
        },
        { label: 'Student Email', value: (r) => r.student?.email || '' },
        { label: 'Amount', value: (r) => r.amount },
        { label: 'Your Earnings', value: (r) => r.teacherEarnings },
        { label: 'Status', value: (r) => r.status },
      ];
      filename = 'transactions';
    }

    const csv = toCsv(rows, columns);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to export data.' });
  }
};
