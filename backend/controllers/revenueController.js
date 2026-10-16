import Revenue from '../models/Revenue.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * Record revenue (ad, course purchase, or donation).
 * POST /api/revenue
 * Body: { source: 'ad'|'course'|'donation', amount: number, description?, metadata? }
 */
export const recordRevenue = asyncHandler(async (req, res) => {
  const { source, amount, currency, description, metadata } = req.body;

  if (!source || amount == null || amount < 0) {
    throw new AppError('Source and amount (>= 0) are required.', 400);
  }

  const validSources = ['ad', 'course', 'donation'];
  if (!validSources.includes(source)) {
    throw new AppError('Source must be ad, course, or donation.', 400);
  }

  const revenue = await Revenue.create({
    source,
    amount: Number(amount),
    currency: currency || 'USD',
    description: description || '',
    metadata: metadata || {},
  });

  res.status(201).json({
    success: true,
    data: revenue,
  });
});

/**
 * Get revenue summary for a period.
 * GET /api/revenue/summary?year=&month=&source=
 */
export const getRevenueSummary = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10);
  const month = parseInt(req.query.month, 10);
  const source = req.query.source;

  const match = {};
  if (year && month) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    match.createdAt = { $gte: start, $lte: end };
  }
  if (source) match.source = source;

  const summary = await Revenue.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$source',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const bySource = summary.reduce((acc, s) => {
    acc[s._id] = { total: s.total, count: s.count };
    return acc;
  }, {});

  const total = summary.reduce((sum, s) => sum + s.total, 0);

  res.json({
    success: true,
    data: {
      bySource,
      total,
    },
  });
});
