import Question from '../models/Question.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';

/**
 * All student questions across every course the teacher owns, for the
 * teacher's Q&A inbox.
 * GET /api/questions/teacher/:teacherId
 */
export const getQuestionsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const currentUserId = req.user._id.toString();
    if (currentUserId !== teacherId || req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const courses = await Course.find({ creator: teacherId }).select('_id title').lean();
    const courseIds = courses.map((c) => c._id);
    const courseMap = Object.fromEntries(courses.map((c) => [c._id.toString(), c]));

    const lectures = await Lecture.find({ courseId: { $in: courseIds } })
      .select('_id lectureTitle courseId')
      .lean();
    const lectureIds = lectures.map((l) => l._id);
    const lectureMap = Object.fromEntries(lectures.map((l) => [l._id.toString(), l]));

    const questions = await Question.find({ lectureId: { $in: lectureIds } })
      .populate('studentId', 'name email profileImg')
      .sort({ answered: 1, createdAt: -1 })
      .lean();

    const data = questions.map((q) => {
      const lecture = lectureMap[q.lectureId.toString()];
      const course = lecture ? courseMap[lecture.courseId.toString()] : undefined;
      return {
        _id: q._id,
        question: q.question,
        timestamp: q.timestamp,
        answered: q.answered,
        answer: q.answer,
        answeredAt: q.answeredAt,
        createdAt: q.createdAt,
        student: q.studentId,
        lectureId: q.lectureId,
        lectureTitle: lecture?.lectureTitle || 'Unknown lecture',
        courseId: lecture?.courseId,
        courseTitle: course?.title || 'Unknown course',
      };
    });

    res.json({
      success: true,
      data: {
        questions: data,
        unansweredCount: data.filter((q) => !q.answered).length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch questions.' });
  }
};

/**
 * POST /api/questions/:studentId
 */
export const createQuestion = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { lectureId, question, timestamp } = req.body;
    if (!lectureId || !question?.trim()) {
      return res.status(400).json({ success: false, message: 'lectureId and question are required.' });
    }

    const newQuestion = await Question.create({
      studentId,
      lectureId,
      question: question.trim(),
      timestamp: timestamp || 0,
    });

    res.status(201).json({ success: true, data: newQuestion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to submit question.' });
  }
};

/**
 * GET /api/questions/:lectureId/:studentId
 */
export const getQuestionsByLectureAndStudent = async (req, res) => {
  try {
    const { lectureId, studentId } = req.params;
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const questions = await Question.find({ lectureId, studentId })
      .sort({ timestamp: 1 })
      .lean();
    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch questions.' });
  }
};

/**
 * All students' questions for a lecture (instructor view).
 * GET /api/questions/lecture/:lectureId
 */
export const getQuestionsByLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const questions = await Question.find({ lectureId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch questions.' });
  }
};

/**
 * PATCH /api/questions/answer/:id
 */
export const answerQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only instructors can answer questions.' });
    }

    const { answer } = req.body;
    if (!answer?.trim()) {
      return res.status(400).json({ success: false, message: 'Answer text is required.' });
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      {
        answer: answer.trim(),
        answered: true,
        answeredBy: req.user._id,
        answeredAt: new Date(),
      },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to answer question.' });
  }
};

/**
 * PATCH /api/questions/:id
 */
export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    if (question.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { question: questionText, timestamp } = req.body;
    if (questionText !== undefined) question.question = questionText;
    if (timestamp !== undefined) question.timestamp = timestamp;
    await question.save();

    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update question.' });
  }
};

/**
 * DELETE /api/questions/:id
 */
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    if (question.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await question.deleteOne();
    res.json({ success: true, data: { message: 'Question deleted.' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete question.' });
  }
};
