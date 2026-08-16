import mongoose from 'mongoose';
import MessageThread from '../models/MessageThread.js';
import Message from '../models/Message.js';
import {
  formatThread,
  formatMessage,
  buildPagination,
} from '../utils/messageFormatters.js';

const requireSelf = (req, res, userId) => {
  if (req.user._id.toString() !== userId) {
    res.status(403).json({ success: false, message: 'You can only access your own messages.' });
    return false;
  }
  return true;
};

const PARTICIPANT_POPULATE = 'name email profileImg role';

/**
 * Custom folders only - the default folders (Inbox/Sent/Drafts/Starred/
 * Archived/Trash) are computed client-side from stats, so there is nothing
 * to build here unless custom folders exist (not exposed in the UI yet).
 * GET /api/messaging/users/:userId/folders
 */
export const getFolders = async (req, res) => {
  try {
    if (!requireSelf(req, res, req.params.userId)) return;
    res.json({ success: true, message: '', data: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch folders.' });
  }
};

/**
 * GET /api/messaging/users/:userId/threads
 */
export const getThreadsByFolder = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!requireSelf(req, res, userId)) return;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const folderType = (req.query.folderType || 'inbox').toLowerCase();

    // Drafts aren't threads - they live in MessageDraft and are fetched via
    // the dedicated /messages/users/:userId/drafts endpoint.
    if (folderType === 'drafts') {
      return res.json({
        success: true,
        message: '',
        data: { threads: [], pagination: buildPagination(page, limit, 0) },
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter = { participants: userObjectId };

    if (folderType === 'starred') {
      const starredThreadIds = await Message.distinct('threadId', { starredBy: userObjectId });
      filter._id = { $in: starredThreadIds };
      filter.participantStates = { $elemMatch: { user: userObjectId, isDeleted: false } };
    } else if (folderType === 'archived') {
      filter.participantStates = {
        $elemMatch: { user: userObjectId, isArchived: true, isDeleted: false },
      };
    } else if (folderType === 'trash') {
      filter.participantStates = { $elemMatch: { user: userObjectId, isDeleted: true } };
    } else if (folderType === 'sent') {
      filter.createdBy = userObjectId;
      filter.participantStates = { $elemMatch: { user: userObjectId, isDeleted: false } };
    } else {
      // inbox / custom / anything else - the general "active conversations" view
      filter.participantStates = {
        $elemMatch: { user: userObjectId, isArchived: false, isDeleted: false },
      };
    }

    if (req.query.search) {
      filter.subject = { $regex: String(req.query.search), $options: 'i' };
    }
    if (req.query.courseId) {
      filter['metadata.courseId'] = req.query.courseId;
    }

    const total = await MessageThread.countDocuments(filter);
    const threads = await MessageThread.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('participants', PARTICIPANT_POPULATE)
      .populate({
        path: 'lastMessage',
        populate: [
          { path: 'sender', select: PARTICIPANT_POPULATE },
          { path: 'recipient', select: PARTICIPANT_POPULATE },
        ],
      })
      .lean();

    res.json({
      success: true,
      message: '',
      data: {
        threads: threads.map((t) => formatThread(t, userId)),
        pagination: buildPagination(page, limit, total),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch threads.' });
  }
};

/**
 * GET /api/messaging/conversations/:threadId/messages
 */
export const getThreadMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await MessageThread.findById(threadId).lean();
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    const isParticipant = thread.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit, 10) || 50));

    const total = await Message.countDocuments({ threadId });
    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', PARTICIPANT_POPULATE)
      .populate('recipient', PARTICIPANT_POPULATE)
      .lean();

    res.json({
      success: true,
      message: '',
      data: {
        messages: messages.map((m) => formatMessage(m, req.user._id)),
        pagination: buildPagination(page, limit, total),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch messages.' });
  }
};

/**
 * GET /api/messaging/users/:userId/search
 */
export const searchMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!requireSelf(req, res, userId)) return;

    const q = String(req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

    if (!q) {
      return res.json({
        success: true,
        message: '',
        data: { data: [], pagination: buildPagination(page, limit, 0) },
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter = {
      $and: [
        { $or: [{ sender: userObjectId }, { recipient: userObjectId }] },
        { $or: [{ subject: { $regex: q, $options: 'i' } }, { content: { $regex: q, $options: 'i' } }] },
      ],
    };

    const total = await Message.countDocuments(filter);
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', PARTICIPANT_POPULATE)
      .populate('recipient', PARTICIPANT_POPULATE)
      .lean();

    const threadIds = [...new Set(messages.map((m) => m.threadId.toString()))];
    const threads = await MessageThread.find({ _id: { $in: threadIds } })
      .populate('participants', PARTICIPANT_POPULATE)
      .lean();
    const threadById = Object.fromEntries(threads.map((t) => [t._id.toString(), t]));

    const results = messages.map((m) => {
      const formattedMessage = formatMessage(m, userId);
      return {
        message: formattedMessage,
        thread: formatThread(threadById[m.threadId.toString()], userId),
        highlights: { subject: m.subject, content: m.content },
        relevanceScore: 1,
      };
    });

    res.json({
      success: true,
      message: '',
      data: { data: results, pagination: buildPagination(page, limit, total) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to search messages.' });
  }
};

/**
 * GET /api/messaging/users/:userId/stats
 */
export const getMessageStats = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!requireSelf(req, res, userId)) return;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totalMessages, unreadMessages, sentMessages, receivedMessages, starredMessages, archivedMessages] =
      await Promise.all([
        Message.countDocuments({ $or: [{ sender: userObjectId }, { recipient: userObjectId }] }),
        Message.countDocuments({ recipient: userObjectId, readBy: { $ne: userObjectId } }),
        Message.countDocuments({ sender: userObjectId }),
        Message.countDocuments({ recipient: userObjectId }),
        Message.countDocuments({
          $or: [{ sender: userObjectId }, { recipient: userObjectId }],
          starredBy: userObjectId,
        }),
        MessageThread.countDocuments({
          participants: userObjectId,
          participantStates: { $elemMatch: { user: userObjectId, isArchived: true, isDeleted: false } },
        }),
      ]);

    res.json({
      success: true,
      message: '',
      data: {
        totalMessages,
        unreadMessages,
        sentMessages,
        receivedMessages,
        starredMessages,
        archivedMessages,
        messagesByType: {},
        messagesByPriority: {},
        responseTime: { average: 0, median: 0 },
        activityTrends: [],
        period: req.query.period || 'month',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch message stats.' });
  }
};
