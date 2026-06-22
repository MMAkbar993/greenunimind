import Revenue from '../models/Revenue.js';

/**
 * Record revenue (ad, course purchase, or donation).
 * POST /api/revenue
 * Body: { source: 'ad'|'course'|'donation', amount: number, description?, metadata? }
 */
export const recordRevenue = async (req, res) => {
  try {
    const { source, amount, currency, description, metadata } = req.body;

    if (!source || amount == null || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Source and amount (>= 0) are required.',
      });
    }

    const validSources = ['ad', 'course', 'donation'];
    if (!validSources.includes(source)) {
      return res.status(400).json({
        success: false,
        message: 'Source must be ad, course, or donation.',
      });
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
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to record revenue.',
    });
  }
};

/**
 * Get revenue summary for a period.
 * GET /api/revenue/summary?year=&month=&source=
 */
export const getRevenueSummary = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch revenue summary.',
    });
  }
};
