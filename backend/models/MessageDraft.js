import mongoose from 'mongoose';

const messageDraftSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    subject: { type: String, default: '' },
    content: { type: String, default: '' },
    messageType: { type: String, default: 'direct' },
    priority: { type: String, default: 'normal' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

const MessageDraft = mongoose.model('MessageDraft', messageDraftSchema);
export default MessageDraft;
