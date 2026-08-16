import mongoose from 'mongoose';

// Attachment metadata only - there is no file upload pipeline wired to the
// compose UI yet, so this stores whatever well-formed metadata is passed in.
const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

const messageSchema = new mongoose.Schema(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageThread',
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: { type: String, default: '' },
    content: { type: String, required: true, trim: true },
    attachments: [attachmentSchema],
    messageType: {
      type: String,
      enum: [
        'direct',
        'announcement',
        'system_notification',
        'course_discussion',
        'assignment_feedback',
        'grade_notification',
        'reminder',
        'support_ticket',
      ],
      default: 'direct',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    metadata: {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      courseName: String,
    },
  },
  { timestamps: true }
);

messageSchema.index({ threadId: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ recipient: 1 });
messageSchema.index({ subject: 'text', content: 'text' });

const Message = mongoose.model('Message', messageSchema);
export default Message;
