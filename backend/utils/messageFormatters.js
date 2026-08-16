// Shapes Mongoose docs into the exact JSON shapes frontend/src/types/message.ts expects.

export const formatUser = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    profileImg: user.profileImg,
    role: user.role,
  };
};

export const formatAttachment = (attachment) => ({
  _id: attachment._id,
  fileName: attachment.fileName,
  fileUrl: attachment.fileUrl,
  fileType: attachment.fileType,
  fileSize: attachment.fileSize,
  uploadedAt: attachment.uploadedAt,
});

// `viewerId` decides the viewer-relative fields (isRead/isStarred/status).
export const formatMessage = (message, viewerId) => {
  if (!message) return null;
  const viewerIdStr = viewerId?.toString();
  const readBy = (message.readBy || []).map((id) => id.toString());
  const starredBy = (message.starredBy || []).map((id) => id.toString());
  const isRead = viewerIdStr ? readBy.includes(viewerIdStr) : false;

  // Only the recipient's read state matters for the sender-facing checkmarks;
  // there's no delivery-receipt mechanism, so status is binary sent/read.
  const recipientId = message.recipient?._id?.toString() || message.recipient?.toString();
  const status = recipientId && readBy.includes(recipientId) ? 'read' : 'sent';

  return {
    _id: message._id,
    threadId: message.threadId,
    sender: message.sender?.name ? formatUser(message.sender) : message.sender,
    recipient: message.recipient?.name ? formatUser(message.recipient) : message.recipient,
    subject: message.subject,
    content: message.content,
    attachments: (message.attachments || []).map(formatAttachment),
    messageType: message.messageType,
    priority: message.priority,
    status,
    isRead,
    isStarred: viewerIdStr ? starredBy.includes(viewerIdStr) : false,
    isArchived: false,
    isDeleted: false,
    parentMessageId: message.parentMessageId,
    metadata: message.metadata || {},
    readAt: isRead ? message.updatedAt : undefined,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

export const formatThread = (thread, viewerId) => {
  if (!thread) return null;
  const viewerIdStr = viewerId?.toString();
  const myState = (thread.participantStates || []).find(
    (s) => s.user?.toString() === viewerIdStr
  );

  return {
    _id: thread._id,
    participants: (thread.participants || []).map(formatUser),
    subject: thread.subject,
    lastMessage: formatMessage(thread.lastMessage, viewerId),
    messageCount: thread.messageCount,
    unreadCount: myState?.unreadCount || 0,
    isArchived: myState?.isArchived || false,
    isPinned: false,
    tags: [],
    metadata: thread.metadata || {},
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
};

export const formatDraft = (draft) => {
  if (!draft) return null;
  return {
    _id: draft._id,
    recipientIds: draft.recipientIds,
    subject: draft.subject,
    content: draft.content,
    messageType: draft.messageType,
    priority: draft.priority,
    attachments: [],
    courseId: draft.courseId,
    parentMessageId: draft.parentMessageId,
    autoSavedAt: draft.updatedAt,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
};

// The compose UI sends `attachments: File[]` over JSON, which serializes to
// `{}` per file (File objects have no enumerable own properties) - there is
// no upload pipeline behind this field yet. Keep only entries that already
// look like real, pre-uploaded attachment metadata and drop the rest instead
// of storing empty junk.
export const sanitizeAttachments = (attachments) => {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .filter((a) => a && typeof a === 'object' && typeof a.fileUrl === 'string' && a.fileUrl)
    .map((a) => ({
      fileName: a.fileName || 'attachment',
      fileUrl: a.fileUrl,
      fileType: a.fileType || '',
      fileSize: typeof a.fileSize === 'number' ? a.fileSize : 0,
    }));
};

export const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});
