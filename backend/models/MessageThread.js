import mongoose from 'mongoose';

// Per-participant view of a thread (archived/deleted/unread are independent
// per user - archiving a conversation shouldn't hide it from the other side).
const participantStateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    unreadCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const messageThreadSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    subject: { type: String, default: '(No subject)' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    messageCount: { type: Number, default: 0 },
    participantStates: [participantStateSchema],
    metadata: {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      courseName: String,
    },
  },
  { timestamps: true }
);

messageThreadSchema.index({ participants: 1, updatedAt: -1 });

const MessageThread = mongoose.model('MessageThread', messageThreadSchema);
export default MessageThread;
