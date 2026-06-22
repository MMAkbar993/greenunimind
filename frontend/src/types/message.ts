// Message Types for LMS Platform

export interface User {
  _id: string;
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
  profileImg?: string;
  photoUrl?: string;
  role: 'teacher' | 'student' | 'admin';
}

export interface MessageAttachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Message {
  _id: string;
  threadId: string;
  sender: User;
  recipient: User;
  subject: string;
  content: string;
  attachments: MessageAttachment[];
  messageType: MessageType;
  priority: MessagePriority;
  status: MessageStatus;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  parentMessageId?: string;
  metadata: {
    courseId?: string;
    courseName?: string;
    lectureId?: string;
    lectureName?: string;
    assignmentId?: string;
    assignmentName?: string;
    relatedEntity?: {
      entityType: string;
      entityId: string;
      entityName: string;
    };
  };
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum MessageType {
  DIRECT = 'direct',
  ANNOUNCEMENT = 'announcement',
  SYSTEM_NOTIFICATION = 'system_notification',
  COURSE_DISCUSSION = 'course_discussion',
  ASSIGNMENT_FEEDBACK = 'assignment_feedback',
  GRADE_NOTIFICATION = 'grade_notification',
  REMINDER = 'reminder',
  SUPPORT_TICKET = 'support_ticket'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum MessageStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  REPLIED = 'replied',
  FORWARDED = 'forwarded',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export interface MessageThread {
  _id: string;
  participants: User[];
  subject: string;
  lastMessage: Message;
  messageCount: number;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  tags: string[];
  metadata: {
    courseId?: string;
    courseName?: string;
    relatedEntity?: {
      entityType: string;
      entityId: string;
      entityName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface MessageFolder {
  _id: string;
  name: string;
  type: FolderType;
  messageCount: number;
  unreadCount: number;
  color?: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum FolderType {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  STARRED = 'starred',
  ARCHIVED = 'archived',
  TRASH = 'trash',
  CUSTOM = 'custom'
}

export interface MessageFilters {
  folderId?: string;
  messageType?: MessageType;
  priority?: MessagePriority;
  status?: MessageStatus;
  isRead?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  senderId?: string;
  recipientId?: string;
  courseId?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  searchQuery?: string;
  tags?: string[];
}

export interface MessageSearchResult {
  message: Message;
  thread: MessageThread;
  highlights: {
    subject?: string;
    content?: string;
    senderName?: string;
  };
  relevanceScore: number;
}

export interface MessageStats {
  totalMessages: number;
  unreadMessages: number;
  sentMessages: number;
  receivedMessages: number;
  starredMessages: number;
  archivedMessages: number;
  messagesByType: Record<MessageType, number>;
  messagesByPriority: Record<MessagePriority, number>;
  responseTime: {
    average: number;
    median: number;
  };
  activityTrends: Array<{
    date: string;
    sent: number;
    received: number;
  }>;
}

export interface ComposeMessageData {
  recipientIds: string[];
  subject: string;
  content: string;
  messageType: MessageType;
  priority: MessagePriority;
  attachments: File[];
  courseId?: string;
  parentMessageId?: string;
  isDraft: boolean;
  scheduledSendAt?: string;
}

export interface MessageNotification {
  _id: string;
  userId: string;
  messageId: string;
  threadId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  actionUrl?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  MESSAGE_REPLY = 'message_reply',
  MENTION = 'mention',
  ASSIGNMENT_FEEDBACK = 'assignment_feedback',
  GRADE_UPDATE = 'grade_update',
  COURSE_ANNOUNCEMENT = 'course_announcement',
  SYSTEM_ALERT = 'system_alert'
}

// API Response Types
export interface MessageApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedMessageResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Real-time Message Events
export interface MessageEvent {
  type: MessageEventType;
  data: Message | MessageThread | MessageNotification;
  timestamp: string;
  userId: string;
}

export enum MessageEventType {
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_READ = 'message_read',
  MESSAGE_DELETED = 'message_deleted',
  THREAD_UPDATED = 'thread_updated',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline'
}

export interface TypingIndicator {
  threadId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

export interface MessageDraft {
  _id: string;
  recipientIds: string[];
  subject: string;
  content: string;
  messageType: MessageType;
  priority: MessagePriority;
  attachments: MessageAttachment[];
  courseId?: string;
  parentMessageId?: string;
  autoSavedAt: string;
  createdAt: string;
  updatedAt: string;
}
