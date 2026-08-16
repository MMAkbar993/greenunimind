import User from '../models/User.js';
import Course from '../models/Course.js';
import MessageThread from '../models/MessageThread.js';
import Message from '../models/Message.js';
import MessageDraft from '../models/MessageDraft.js';
import {
  formatMessage,
  formatThread,
  formatDraft,
  sanitizeAttachments,
  buildPagination,
} from '../utils/messageFormatters.js';

const PARTICIPANT_POPULATE = 'name email profileImg role';

const populateMessage = (query) =>
  query.populate('sender', PARTICIPANT_POPULATE).populate('recipient', PARTICIPANT_POPULATE);

/**
 * Compose creates a brand-new thread per recipient (so each conversation
 * keeps the 2-participant shape the thread UI assumes); replying to an
 * existing conversation goes through replyToMessage instead.
 * POST /api/messages/send
 */
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const {
      recipientIds,
      subject,
      content,
      messageType,
      priority,
      attachments,
      courseId,
      parentMessageId,
    } = req.body;

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one recipient is required.' });
    }
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const recipients = await User.find({ _id: { $in: recipientIds } }).select('_id').lean();
    if (recipients.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid recipients found.' });
    }

    let courseName;
    if (courseId) {
      const course = await Course.findById(courseId).select('title').lean();
      courseName = course?.title;
    }

    const cleanAttachments = sanitizeAttachments(attachments);
    const cleanSubject = subject?.trim() || '(No subject)';
    const createdMessages = [];

    for (const recipient of recipients) {
      const thread = await MessageThread.create({
        participants: [senderId, recipient._id],
        subject: cleanSubject,
        createdBy: senderId,
        metadata: { courseId: courseId || undefined, courseName },
        participantStates: [
          { user: senderId, unreadCount: 0 },
          { user: recipient._id, unreadCount: 1 },
        ],
      });

      const message = await Message.create({
        threadId: thread._id,
        sender: senderId,
        recipient: recipient._id,
        subject: cleanSubject,
        content: content.trim(),
        attachments: cleanAttachments,
        messageType: messageType || 'direct',
        priority: priority || 'normal',
        parentMessageId: parentMessageId || undefined,
        metadata: { courseId: courseId || undefined, courseName },
      });

      thread.lastMessage = message._id;
      thread.messageCount = 1;
      await thread.save();

      createdMessages.push(message);
    }

    const firstMessage = await populateMessage(Message.findById(createdMessages[0]._id)).lean();

    res.status(201).json({
      success: true,
      message: 'Message sent.',
      data: formatMessage(firstMessage, senderId),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to send message.' });
  }
};

/**
 * POST /api/messages/threads/:threadId/reply
 */
export const replyToMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { threadId } = req.params;
    const { content, attachments } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content is required.' });
    }

    const thread = await MessageThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    const isParticipant = thread.participants.some((p) => p.equals(senderId));
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const recipientId = thread.participants.find((p) => !p.equals(senderId));

    const message = await Message.create({
      threadId: thread._id,
      sender: senderId,
      recipient: recipientId,
      subject: thread.subject,
      content: content.trim(),
      attachments: sanitizeAttachments(attachments),
      metadata: thread.metadata,
    });

    thread.lastMessage = message._id;
    thread.messageCount = (thread.messageCount || 0) + 1;

    for (const participantId of thread.participants) {
      let state = thread.participantStates.find((s) => s.user.equals(participantId));
      if (!state) {
        thread.participantStates.push({ user: participantId, unreadCount: 0 });
        state = thread.participantStates[thread.participantStates.length - 1];
      }
      if (participantId.equals(recipientId)) {
        state.unreadCount = (state.unreadCount || 0) + 1;
        // New activity brings the conversation back for the recipient even
        // if they'd archived/deleted it.
        state.isArchived = false;
        state.isDeleted = false;
      }
    }

    await thread.save();

    const populated = await populateMessage(Message.findById(message._id)).lean();

    res.status(201).json({
      success: true,
      message: 'Reply sent.',
      data: formatMessage(populated, senderId),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to send reply.' });
  }
};

/**
 * PATCH /api/messages/mark-read
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.json({ success: true, message: '', data: null });
    }

    await Message.updateMany(
      { _id: { $in: messageIds }, recipient: req.user._id },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, message: '', data: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to mark messages as read.' });
  }
};

/**
 * PATCH /api/messages/threads/:threadId/mark-read
 */
export const markThreadAsRead = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await MessageThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    const isParticipant = thread.participants.some((p) => p.equals(req.user._id));
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await Message.updateMany(
      { threadId, recipient: req.user._id },
      { $addToSet: { readBy: req.user._id } }
    );

    const state = thread.participantStates.find((s) => s.user.equals(req.user._id));
    if (state) {
      state.unreadCount = 0;
    } else {
      thread.participantStates.push({ user: req.user._id, unreadCount: 0 });
    }
    await thread.save();

    res.json({ success: true, message: '', data: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to mark conversation as read.' });
  }
};

/**
 * PATCH /api/messages/:messageId/star
 */
export const toggleMessageStar = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { isStarred } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }
    const isParticipant =
      message.sender.equals(req.user._id) || message.recipient.equals(req.user._id);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (isStarred) {
      await Message.updateOne({ _id: messageId }, { $addToSet: { starredBy: req.user._id } });
    } else {
      await Message.updateOne({ _id: messageId }, { $pull: { starredBy: req.user._id } });
    }

    const updated = await populateMessage(Message.findById(messageId)).lean();
    res.json({ success: true, message: '', data: formatMessage(updated, req.user._id) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update message.' });
  }
};

/**
 * PATCH /api/messages/threads/:threadId/archive
 */
export const toggleThreadArchive = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { isArchived } = req.body;

    const thread = await MessageThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    const isParticipant = thread.participants.some((p) => p.equals(req.user._id));
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    let state = thread.participantStates.find((s) => s.user.equals(req.user._id));
    if (!state) {
      thread.participantStates.push({ user: req.user._id, isArchived: !!isArchived });
    } else {
      state.isArchived = !!isArchived;
    }
    await thread.save();

    const populated = await MessageThread.findById(threadId)
      .populate('participants', PARTICIPANT_POPULATE)
      .populate({
        path: 'lastMessage',
        populate: [
          { path: 'sender', select: PARTICIPANT_POPULATE },
          { path: 'recipient', select: PARTICIPANT_POPULATE },
        ],
      })
      .lean();

    res.json({ success: true, message: '', data: formatThread(populated, req.user._id) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update conversation.' });
  }
};

/**
 * Soft-deletes (moves to Trash) or permanently removes conversations for the
 * current user. Every call site in the UI passes thread ids here despite the
 * "messageIds" name, so ids are treated as thread ids.
 * DELETE /api/messages/delete
 */
export const deleteMessages = async (req, res) => {
  try {
    const { messageIds, permanent } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.json({ success: true, message: '', data: null });
    }

    const threads = await MessageThread.find({
      _id: { $in: messageIds },
      participants: req.user._id,
    });

    for (const thread of threads) {
      if (permanent) {
        thread.participants = thread.participants.filter((p) => !p.equals(req.user._id));
        thread.participantStates = thread.participantStates.filter(
          (s) => !s.user.equals(req.user._id)
        );
        if (thread.participants.length === 0) {
          await Message.deleteMany({ threadId: thread._id });
          await thread.deleteOne();
        } else {
          await thread.save();
        }
      } else {
        let state = thread.participantStates.find((s) => s.user.equals(req.user._id));
        if (!state) {
          thread.participantStates.push({ user: req.user._id, isDeleted: true });
        } else {
          state.isDeleted = true;
        }
        await thread.save();
      }
    }

    res.json({ success: true, message: '', data: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete conversation(s).' });
  }
};

/**
 * No notification pipeline is wired up yet (nothing in the UI renders
 * these), so this honestly reports "none" rather than faking data.
 * GET /api/messages/users/:userId/notifications
 */
export const getNotifications = async (req, res) => {
  if (req.user._id.toString() !== req.params.userId) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  res.json({
    success: true,
    message: '',
    data: { data: [], pagination: buildPagination(page, limit, 0) },
  });
};

/**
 * PATCH /api/messages/notifications/mark-read
 */
export const markNotificationsAsRead = async (_req, res) => {
  res.json({ success: true, message: '', data: null });
};

/**
 * POST /api/messages/drafts or PUT /api/messages/drafts/:draftId
 */
export const saveDraft = async (req, res) => {
  try {
    const owner = req.user._id;
    const { draftId } = req.params;
    const { recipientIds, subject, content, messageType, priority, courseId, parentMessageId } =
      req.body;

    let draft;
    if (draftId) {
      draft = await MessageDraft.findOne({ _id: draftId, owner });
      if (!draft) {
        return res.status(404).json({ success: false, message: 'Draft not found.' });
      }
      Object.assign(draft, {
        recipientIds: recipientIds ?? draft.recipientIds,
        subject: subject ?? draft.subject,
        content: content ?? draft.content,
        messageType: messageType ?? draft.messageType,
        priority: priority ?? draft.priority,
        courseId: courseId ?? draft.courseId,
        parentMessageId: parentMessageId ?? draft.parentMessageId,
      });
      await draft.save();
    } else {
      draft = await MessageDraft.create({
        owner,
        recipientIds: recipientIds || [],
        subject: subject || '',
        content: content || '',
        messageType: messageType || 'direct',
        priority: priority || 'normal',
        courseId: courseId || undefined,
        parentMessageId: parentMessageId || undefined,
      });
    }

    res.status(201).json({ success: true, message: 'Draft saved.', data: formatDraft(draft) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to save draft.' });
  }
};

/**
 * GET /api/messages/users/:userId/drafts
 */
export const getDrafts = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

    const total = await MessageDraft.countDocuments({ owner: userId });
    const drafts = await MessageDraft.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      message: '',
      data: { data: drafts.map(formatDraft), pagination: buildPagination(page, limit, total) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch drafts.' });
  }
};

/**
 * DELETE /api/messages/drafts/:draftId
 */
export const deleteDraft = async (req, res) => {
  try {
    const draft = await MessageDraft.findOne({ _id: req.params.draftId, owner: req.user._id });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found.' });
    }
    await draft.deleteOne();
    res.json({ success: true, message: '', data: { message: 'Draft deleted.' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete draft.' });
  }
};
