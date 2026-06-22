import Course from '../models/Course.js';

const PER_PAGE = 10;

/**
 * AI-powered sustainability search API.
 * GET /api/search?query=<term>&page=<int>
 * Returns sustainability-focused search results with links to courses.
 * Matches documentation format: { results: [{ title, description, link }] }
 */
export const searchSustainability = async (req, res) => {
  try {
    const query = (req.query.query || req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * PER_PAGE;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required.',
      });
    }

    const filter = {
      isPublished: true,
      status: 'published',
      $or: [
        { title: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { subtitle: new RegExp(query, 'i') },
        { category: new RegExp(query, 'i') },
        { subcategory: new RegExp(query, 'i') },
      ],
    };

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort({ totalEnrollment: -1, createdAt: -1 })
        .skip(skip)
        .limit(PER_PAGE)
        .select('title subtitle description category _id')
        .lean(),
      Course.countDocuments(filter),
    ]);

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const results = courses.map((c) => ({
      title: c.title,
      description: c.subtitle || c.description?.substring(0, 200) || 'No description',
      link: `${baseUrl}/courses/${c._id}`,
      type: 'course',
      category: c.category,
    }));

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page,
          perPage: PER_PAGE,
          total,
          totalPages: Math.ceil(total / PER_PAGE),
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Search failed.',
    });
  }
};
