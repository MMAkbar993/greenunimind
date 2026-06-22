import React, { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { setSelectedThread } from '@/redux/features/message/messageSlice';
import { 
  useGetThreadMessagesQuery,
  useReplyToMessageMutation,
  useMarkThreadAsReadMutation,
  useToggleMessageStarMutation
} from '@/redux/features/message/messageApi';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { Message, MessageThread as MessageThreadType } from '@/types/message';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Star,
  MoreVertical,
  Reply,
  Forward,
  Archive,
  Trash2,
  Download,
  ExternalLink,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { format } from 'date-fns';

interface MessageThreadProps {
  threadId: string;
  onBack?: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({ threadId, onBack }) => {
  const dispatch = useAppDispatch();
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: userData } = useGetMeQuery(undefined);
  // For messaging, we need the User._id (not Teacher._id)
  // The Teacher document has a 'user' field that references the User._id
  const userId = userData?.data?.user?._id || userData?.data?._id;

  const {
    data: messagesData,
    isLoading,
    error
  } = useGetThreadMessagesQuery(
    { threadId, page: 1, limit: 50 },
    { skip: !threadId }
  );

  const [replyToMessage] = useReplyToMessageMutation();
  const [markAsRead] = useMarkThreadAsReadMutation();
  const [toggleStar] = useToggleMessageStarMutation();

  const messages = messagesData?.data?.data || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark thread as read when opened
  useEffect(() => {
    if (threadId) {
      markAsRead({ threadId });
    }
  }, [threadId, markAsRead]);

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await replyToMessage({
        threadId,
        content: replyContent.trim()
      }).unwrap();
      
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleReply();
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender._id === userId) {
      switch (message.status) {
        case 'sent':
          return <Check className="h-3 w-3 text-gray-400" />;
        case 'delivered':
          return <CheckCheck className="h-3 w-3 text-gray-400" />;
        case 'read':
          return <CheckCheck className="h-3 w-3 text-blue-500" />;
        default:
          return <Clock className="h-3 w-3 text-gray-400" />;
      }
    }
    return null;
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.sender._id === userId;
    const showAvatar = index === 0 || messages[index - 1]?.sender._id !== message.sender._id;
    const showTimestamp = index === messages.length - 1 || 
      messages[index + 1]?.sender._id !== message.sender._id ||
      new Date(messages[index + 1]?.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000; // 5 minutes

    return (
      <div
        key={message._id}
        className={cn(
          "flex gap-3 mb-4",
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {showAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={message.sender.profileImg || message.sender.photoUrl} 
                alt={`${message.sender.name.firstName} ${message.sender.name.lastName}`} 
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {message.sender.name.firstName[0]}{message.sender.name.lastName[0]}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>

        {/* Message content */}
        <div className={cn(
          "flex-1 max-w-[70%]",
          isOwnMessage ? "items-end" : "items-start"
        )}>
          {/* Sender name (for first message in group) */}
          {showAvatar && !isOwnMessage && (
            <div className="text-xs font-medium text-gray-700 mb-1">
              {message.sender.name.firstName} {message.sender.name.lastName}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              "relative px-4 py-2 rounded-lg max-w-full",
              isOwnMessage
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-900"
            )}
          >
            {/* Priority indicator */}
            {message.priority === 'high' && (
              <Badge variant="destructive" className="absolute -top-2 -left-2 h-4 text-xs">
                High
              </Badge>
            )}

            {/* Message content */}
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded border",
                      isOwnMessage 
                        ? "bg-blue-500 border-blue-400" 
                        : "bg-white border-gray-200"
                    )}
                  >
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {attachment.fileName}
                      </div>
                      <div className="text-xs opacity-75">
                        {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 w-6 p-0",
                        isOwnMessage ? "text-white hover:bg-blue-500" : "text-gray-600 hover:bg-gray-100"
                      )}
                      onClick={() => window.open(attachment.fileUrl, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Message actions */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 -mt-2 -mr-2"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => toggleStar({ 
                      messageId: message._id, 
                      isStarred: !message.isStarred 
                    })}
                  >
                    <Star className={cn(
                      "h-4 w-4 mr-2",
                      message.isStarred && "fill-current text-yellow-500"
                    )} />
                    {message.isStarred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Timestamp and status */}
          {showTimestamp && (
            <div className={cn(
              "flex items-center gap-1 mt-1 text-xs text-gray-500",
              isOwnMessage ? "justify-end" : "justify-start"
            )}>
              <span>
                {format(new Date(message.createdAt), 'MMM d, h:mm a')}
              </span>
              {getMessageStatus(message)}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full max-w-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !messages.length) {
    return (
      <div className="h-full bg-white flex flex-col">
        {onBack && (
          <div className="p-4 border-b border-gray-200">
            <Button variant="ghost" onClick={onBack} className="p-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">
              {error ? 'Failed to load messages' : 'No messages found'}
            </div>
            <div className="text-sm">
              {error ? 'Please try again later' : 'Start a conversation'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const firstMessage = messages[0];
  const otherParticipant = firstMessage?.recipient?._id === userId 
    ? firstMessage.sender 
    : firstMessage.recipient;

  return (
    <div className="h-full bg-white flex flex-col group">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={otherParticipant?.profileImg || otherParticipant?.photoUrl} 
              alt={`${otherParticipant?.name.firstName} ${otherParticipant?.name.lastName}`} 
            />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {otherParticipant?.name.firstName[0]}{otherParticipant?.name.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">
              {otherParticipant?.name.firstName} {otherParticipant?.name.lastName}
            </div>
            <div className="text-xs text-gray-500">
              {firstMessage?.subject}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Star className="h-4 w-4 mr-2" />
                Star conversation
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new window
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage 
              src={userData?.data?.profileImg || userData?.data?.photoUrl} 
              alt={`${userData?.data?.name?.firstName} ${userData?.data?.name?.lastName}`} 
            />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {userData?.data?.name?.firstName?.[0]}{userData?.data?.name?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none"
              onFocus={() => setIsReplying(true)}
            />
            
            {isReplying && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4 mr-1" />
                    Attach
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyContent.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            )}
            
            {!isReplying && (
              <div className="text-xs text-gray-500">
                Press Ctrl+Enter to send
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
