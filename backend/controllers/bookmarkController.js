import Bookmark from '../models/Bookmark.js';

/**
 * POST /api/bookmarks/:studentId
 */
export const createBookmark = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { title, timestamp, lectureId, category, tags, notes } = req.body;
    if (!lectureId || !title?.trim()) {
      return res.status(400).json({ success: false, message: 'lectureId and title are required.' });
    }

    const bookmark = await Bookmark.create({
      studentId,
      lectureId,
      title: title.trim(),
      timestamp: timestamp || 0,
      category: category || 'Uncategorized',
      tags: tags || [],
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: bookmark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create bookmark.' });
  }
};

/**
 * GET /api/bookmarks/:lectureId/:studentId
 */
export const getBookmarksByLectureAndStudent = async (req, res) => {
  try {
    const { lectureId, studentId } = req.params;
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const bookmarks = await Bookmark.find({ studentId, lectureId })
      .sort({ timestamp: 1 })
      .lean();
    res.json({ success: true, data: bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch bookmarks.' });
  }
};

/**
 * PATCH /api/bookmarks/:id
 */
export const updateBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);
    if (!bookmark) {
      return res.status(404).json({ success: false, message: 'Bookmark not found.' });
    }
    if (bookmark.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { title, category, tags, notes, timestamp } = req.body;
    if (title !== undefined) bookmark.title = title;
    if (category !== undefined) bookmark.category = category;
    if (tags !== undefined) bookmark.tags = tags;
    if (notes !== undefined) bookmark.notes = notes;
    if (timestamp !== undefined) bookmark.timestamp = timestamp;
    await bookmark.save();

    res.json({ success: true, data: bookmark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update bookmark.' });
  }
};

/**
 * DELETE /api/bookmarks/:id
 */
export const deleteBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);
    if (!bookmark) {
      return res.status(404).json({ success: false, message: 'Bookmark not found.' });
    }
    if (bookmark.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await bookmark.deleteOne();
    res.json({ success: true, data: { message: 'Bookmark deleted.' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete bookmark.' });
  }
};

/**
 * GET /api/bookmarks/shared/:lectureId
 */
export const getSharedBookmarks = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const bookmarks = await Bookmark.find({ lectureId, isShared: true }).lean();
    res.json({ success: true, data: bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch shared bookmarks.' });
  }
};

/**
 * POST /api/bookmarks/share/:bookmarkId
 */
export const shareBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.bookmarkId);
    if (!bookmark) {
      return res.status(404).json({ success: false, message: 'Bookmark not found.' });
    }
    if (bookmark.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { studentIds } = req.body;
    bookmark.isShared = true;
    bookmark.sharedWith = Array.isArray(studentIds) ? studentIds : [];
    await bookmark.save();

    res.json({ success: true, data: bookmark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to share bookmark.' });
  }
};

/**
 * GET /api/bookmarks/category/:studentId/:category
 */
export const getBookmarksByCategory = async (req, res) => {
  try {
    const { studentId, category } = req.params;
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const bookmarks = await Bookmark.find({ studentId, category })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch bookmarks.' });
  }
};

/**
 * POST /api/bookmarks/tags/:studentId
 */
export const getBookmarksByTags = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { tags } = req.body;
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const bookmarks = await Bookmark.find({ studentId, tags: { $in: tags } })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch bookmarks.' });
  }
};
