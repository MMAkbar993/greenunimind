import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSaveDraftMutation, useSendMessageMutation } from '@/redux/features/message/messageApi';
import { stopComposing, updateComposeDraft } from '@/redux/features/message/messageSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ComposeMessageData, MessagePriority, MessageType } from '@/types/message';
import { FileText, Image as ImageIcon, Paperclip, Save, Send, Users, Video, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

// User interface for messaging
interface MessageUser {
  _id: string;
  name: { firstName: string; lastName: string; middleName?: string };
  email: string;
  profileImg?: string;
  role: 'student' | 'teacher';
}

const MessageCompose: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isComposing, composeDraft } = useAppSelector(state => state.message);

  const [recipients, setRecipients] = useState<MessageUser[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState<MessageType>(MessageType.DIRECT);
  const [priority, setPriority] = useState<MessagePriority>(MessagePriority.NORMAL);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [recipientSearchOpen, setRecipientSearchOpen] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [saveDraft, { isLoading: isSavingDraft }] = useSaveDraftMutation();

  // Get current user data to get teacher ID
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  // Get enrolled students for messaging
  const { data: enrolledStudentsData, isLoading: isLoadingStudents } = useGetEnrolledStudentsQuery(
    teacherId,
    { skip: !teacherId }
  );

  // Transform enrolled students data to MessageUser format
  const availableUsers: MessageUser[] = React.useMemo(() => {
    if (!enrolledStudentsData?.data) return [];

    return enrolledStudentsData.data.map((student: any) => ({
      _id: student._id,
      name: {
        firstName: student.name?.firstName || '',
        lastName: student.name?.lastName || '',
        middleName: student.name?.middleName,
      },
      email: student.email,
      profileImg: student.profileImg,
      role: 'student' as const,
    }));
  }, [enrolledStudentsData]);

  // Load draft data when component mounts
  useEffect(() => {
    if (composeDraft) {
      setSubject(composeDraft.subject || '');
      setContent(composeDraft.content || '');
      setMessageType(composeDraft.messageType || MessageType.DIRECT);
      setPriority(composeDraft.priority || MessagePriority.NORMAL);
      setIsDraft(composeDraft.isDraft || false);
    }
  }, [composeDraft]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isComposing) return;

    const interval = setInterval(() => {
      if (subject.trim() || content.trim()) {
        handleSaveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [subject, content, recipients, messageType, priority]);

  const handleClose = () => {
    if (subject.trim() || content.trim()) {
      handleSaveDraft();
    }
    dispatch(stopComposing());
  };

  const handleSend = async () => {
    if (!recipients.length) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const messageData: ComposeMessageData = {
        recipientIds: recipients.map(r => r._id),
        subject: subject.trim(),
        content: content.trim(),
        messageType,
        priority,
        attachments,
        isDraft: false,
      };

      await sendMessage(messageData).unwrap();
      toast.success('Message sent successfully');
      dispatch(stopComposing());
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSaveDraft = async () => {
    if (!subject.trim() && !content.trim()) return;

    try {
      const draftData = {
        recipientIds: recipients.map(r => r._id),
        subject: subject.trim(),
        content: content.trim(),
        messageType,
        priority,
        attachments,
        isDraft: true,
      };

      await saveDraft(draftData).unwrap();
      setIsDraft(true);
      dispatch(updateComposeDraft(draftData));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const handleAddRecipient = (user: MessageUser) => {
    if (!recipients.find(r => r._id === user._id)) {
      setRecipients([...recipients, user]);
    }
    setRecipientSearchOpen(false);
  };

  const handleRemoveRecipient = (userId: string) => {
    setRecipients(recipients.filter(r => r._id !== userId));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isComposing) return null;

  return (
    <Dialog open={isComposing} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Compose Message</span>
            {isDraft && (
              <Badge variant="secondary" className="text-xs">
                Draft saved
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Recipients */}
          <div className="space-y-2">
            <Label htmlFor="recipients">To</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
              {recipients.map(recipient => (
                <Badge
                  key={recipient._id}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={recipient.profileImg} />
                    <AvatarFallback className="text-xs">
                      {recipient.name.firstName[0]}
                      {recipient.name.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">
                    {recipient.name.firstName} {recipient.name.lastName}
                  </span>
                  <button
                    onClick={() => handleRemoveRecipient(recipient._id)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              <Popover open={recipientSearchOpen} onOpenChange={setRecipientSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-gray-500 hover:text-gray-700"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Add recipient
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {isLoadingStudents ? (
                          <div className="p-2 text-sm text-gray-500">Loading students...</div>
                        ) : (
                          availableUsers
                            .filter(user => !recipients.find(r => r._id === user._id))
                            .map(user => (
                              <CommandItem
                                key={user._id}
                                onSelect={() => handleAddRecipient(user)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.profileImg} />
                                  <AvatarFallback className="text-xs">
                                    {user.name.firstName[0]}
                                    {user.name.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {user.name.firstName} {user.name.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {user.email} • {user.role}
                                  </div>
                                </div>
                              </CommandItem>
                            ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Message Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="messageType">Type</Label>
              <Select
                value={messageType}
                onValueChange={value => setMessageType(value as MessageType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MessageType.DIRECT}>Direct Message</SelectItem>
                  <SelectItem value={MessageType.ANNOUNCEMENT}>Announcement</SelectItem>
                  <SelectItem value={MessageType.COURSE_DISCUSSION}>Course Discussion</SelectItem>
                  <SelectItem value={MessageType.ASSIGNMENT_FEEDBACK}>
                    Assignment Feedback
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={value => setPriority(value as MessagePriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MessagePriority.LOW}>Low</SelectItem>
                  <SelectItem value={MessagePriority.NORMAL}>Normal</SelectItem>
                  <SelectItem value={MessagePriority.HIGH}>High</SelectItem>
                  <SelectItem value={MessagePriority.URGENT}>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Enter message subject..."
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[200px] resize-none"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attachments</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  Attach Files
                </Button>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                  >
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(index)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || (!subject.trim() && !content.trim())}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !recipients.length || !subject.trim() || !content.trim()}
            >
              <Send className="h-4 w-4 mr-1" />
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageCompose;
