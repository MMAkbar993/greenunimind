import Note from '../models/Note.js';

/**
 * Create or update the current student's note for a lecture (one note per
 * student per lecture).
 * POST /api/notes/:studentId
 */
export const createOrUpdateNote = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { lectureId, content, isRichText, tags } = req.body;
    if (!lectureId) {
      return res.status(400).json({ success: false, message: 'lectureId is required.' });
    }

    const note = await Note.findOneAndUpdate(
      { studentId, lectureId },
      {
        $set: {
          content: content ?? '',
          ...(isRichText !== undefined && { isRichText }),
          ...(tags !== undefined && { tags }),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to save note.' });
  }
};

/**
 * GET /api/notes/:lectureId/:studentId
 */
export const getNoteByLectureAndStudent = async (req, res) => {
  try {
    const { lectureId, studentId } = req.params;
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const note = await Note.findOne({ studentId, lectureId }).lean();
    res.json({ success: true, data: note || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch note.' });
  }
};

/**
 * DELETE /api/notes/:id
 */
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }
    if (note.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await note.deleteOne();
    res.json({ success: true, data: { message: 'Note deleted.' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete note.' });
  }
};

/**
 * GET /api/notes/shared/:lectureId
 */
export const getSharedNotes = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const notes = await Note.find({ lectureId, isShared: true }).lean();
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch shared notes.' });
  }
};

/**
 * POST /api/notes/share/:noteId
 */
export const shareNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }
    if (note.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { studentIds } = req.body;
    note.isShared = true;
    note.sharedWith = Array.isArray(studentIds) ? studentIds : [];
    await note.save();

    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to share note.' });
  }
};
