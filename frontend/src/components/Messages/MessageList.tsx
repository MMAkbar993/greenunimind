import React, { useState, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { 
  setFilters, 
  clearFilters, 
  setMessageListView,
  toggleMessageSelection,
  selectAllMessages,
  clearMessageSelection
} from '@/redux/features/message/messageSlice';
import { 
  useGetMessagesByFolderQuery,
  useMarkThreadAsReadMutation,
  useToggleThreadArchiveMutation,
  useDeleteMessagesMutation
} from '@/redux/features/message/messageApi';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { FolderType, MessageThread, MessageFilters } from '@/types/message';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Mail,
  MailOpen,
  List,
  Grid,
  RefreshCw,
  ChevronDown,
  Paperclip,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import DashboardErrorBoundary from '@/components/ErrorBoundary/DashboardErrorBoundary';
import { MessagesEmptyState } from '@/components/EmptyStates/TeacherEmptyStates';

interface MessageListProps {
  onThreadSelect: (threadId: string) => void;
  currentFolder: FolderType;
}

const MessageList: React.FC<MessageListProps> = ({
  onThreadSelect,
  currentFolder
}) => {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: userData } = useGetMeQuery(undefined);
  // For messaging, we need the User._id (not Teacher._id)
  // The Teacher document has a 'user' field that references the User._id
  const userId = userData?.data?.user?._id || userData?.data?._id;

  const {
    filters,
    selectedMessageIds,
    messageListView,
    selectedThreadId
  } = useAppSelector((state) => state.message);

  // Build query filters
  const queryFilters: MessageFilters = useMemo(() => ({
    ...filters,
    searchQuery: searchQuery.trim() || undefined,
  }), [filters, searchQuery]);

  const {
    data: threadsData,
    isLoading,
    error,
    refetch
  } = useGetMessagesByFolderQuery(
    {
      userId: userId || '',
      folderType: currentFolder,
      page,
      limit,
      filters: queryFilters
    },
    { skip: !userId }
  );

  const [markAsRead] = useMarkThreadAsReadMutation();
  const [toggleArchive] = useToggleThreadArchiveMutation();
  const [deleteMessages] = useDeleteMessagesMutation();

  const threads = threadsData?.data?.data || [];
  const pagination = threadsData?.data?.pagination;

  const handleThreadClick = useCallback((thread: MessageThread) => {
    onThreadSelect(thread._id);
    
    // Mark as read if unread
    if (thread.unreadCount > 0) {
      markAsRead({ threadId: thread._id });
    }
  }, [onThreadSelect, markAsRead]);

  const handleSelectThread = useCallback((threadId: string, checked: boolean) => {
    dispatch(toggleMessageSelection(threadId));
  }, [dispatch]);

  const handleSelectAll = useCallback(() => {
    const allThreadIds = threads.map(thread => thread._id);
    if (selectedMessageIds.length === threads.length) {
      dispatch(clearMessageSelection());
    } else {
      dispatch(selectAllMessages(allThreadIds));
    }
  }, [threads, selectedMessageIds.length, dispatch]);

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedMessageIds.length === 0) return;

    try {
      switch (action) {
        case 'markRead':
          await Promise.all(
            selectedMessageIds.map(threadId => 
              markAsRead({ threadId }).unwrap()
            )
          );
          break;
        case 'archive':
          await Promise.all(
            selectedMessageIds.map(threadId => 
              toggleArchive({ threadId, isArchived: true }).unwrap()
            )
          );
          break;
        case 'delete':
          await deleteMessages({ 
            messageIds: selectedMessageIds,
            permanent: currentFolder === FolderType.TRASH 
          }).unwrap();
          break;
      }
      dispatch(clearMessageSelection());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }, [selectedMessageIds, markAsRead, toggleArchive, deleteMessages, currentFolder, dispatch]);

  const getParticipantName = (thread: MessageThread) => {
    const otherParticipant = thread.participants.find(p => p._id !== userId);
    return otherParticipant 
      ? `${otherParticipant.name.firstName} ${otherParticipant.name.lastName}`
      : 'Unknown';
  };

  const getParticipantAvatar = (thread: MessageThread) => {
    const otherParticipant = thread.participants.find(p => p._id !== userId);
    return otherParticipant?.profileImg || otherParticipant?.photoUrl;
  };

  const getParticipantInitials = (thread: MessageThread) => {
    const otherParticipant = thread.participants.find(p => p._id !== userId);
    return otherParticipant 
      ? `${otherParticipant.name.firstName[0]}${otherParticipant.name.lastName[0]}`
      : 'U';
  };

  const renderThreadItem = (thread: MessageThread) => {
    const isSelected = selectedMessageIds.includes(thread._id);
    const isActive = selectedThreadId === thread._id;
    const hasAttachments = thread.lastMessage?.attachments?.length > 0;
    
    return (
      <div
        key={thread._id}
        className={cn(
          "flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
          isActive && "bg-blue-50 border-blue-200",
          isSelected && "bg-blue-25"
        )}
        onClick={() => handleThreadClick(thread)}
      >
        {/* Selection checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => handleSelectThread(thread._id, checked as boolean)}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        />

        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage 
            src={getParticipantAvatar(thread)} 
            alt={getParticipantName(thread)} 
          />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
            {getParticipantInitials(thread)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                "font-medium truncate",
                thread.unreadCount > 0 ? "text-gray-900" : "text-gray-700"
              )}>
                {getParticipantName(thread)}
              </span>
              {thread.isPinned && (
                <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
              )}
              {hasAttachments && (
                <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
              </span>
              {thread.unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] text-xs px-1.5">
                  {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className={cn(
                "text-sm truncate",
                thread.unreadCount > 0 ? "font-medium text-gray-900" : "text-gray-600"
              )}>
                {thread.subject}
              </p>
              <p className="text-xs text-gray-500 truncate mt-1">
                {thread.lastMessage?.content || 'No content'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => markAsRead({ threadId: thread._id })}>
              {thread.unreadCount > 0 ? (
                <>
                  <MailOpen className="h-4 w-4 mr-2" />
                  Mark as read
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Mark as unread
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Star className="h-4 w-4 mr-2" />
              {thread.isPinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toggleArchive({ threadId: thread._id, isArchived: !thread.isArchived })}>
              <Archive className="h-4 w-4 mr-2" />
              {thread.isArchived ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => deleteMessages({ messageIds: [thread._id] })}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary section="messages">
      <div className="h-full bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Search and filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

        {/* Bulk actions */}
        {selectedMessageIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-blue-700">
              {selectedMessageIds.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('markRead')}
              >
                <MailOpen className="h-4 w-4 mr-1" />
                Mark Read
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('archive')}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* List controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedMessageIds.length === threads.length && threads.length > 0}
              onCheckedChange={handleSelectAll}
              className="flex-shrink-0"
            />
            <span className="text-sm text-gray-600">
              {threads.length} messages
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <List className="h-4 w-4 mr-1" />
                  View
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => dispatch(setMessageListView('comfortable'))}>
                  Comfortable
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => dispatch(setMessageListView('compact'))}>
                  Compact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => dispatch(setMessageListView('list'))}>
                  List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Message list */}
      <ScrollArea className="flex-1">
        {threads.length === 0 ? (
          searchQuery ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-lg font-medium mb-2">No messages found</div>
                <div className="text-sm">Try adjusting your search terms</div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <MessagesEmptyState />
            </div>
          )
        ) : (
          <div className="group">
            {threads.map(renderThreadItem)}
          </div>
        )}
      </ScrollArea>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
    </DashboardErrorBoundary>
  );
};

export default MessageList;
