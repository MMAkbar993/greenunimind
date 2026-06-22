import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { useSearchMessagesQuery } from '@/redux/features/message/messageApi';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { MessageFilters, MessageSearchResult, MessageType, MessagePriority } from '@/types/message';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  MessageSquare,
  Star,
  Paperclip,
  Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessageSearch: React.FC<MessageSearchProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<MessageFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: userData } = useGetMeQuery(undefined);
  // For messaging, we need the User._id (not Teacher._id)
  // The Teacher document has a 'user' field that references the User._id
  const userId = userData?.data?.user?._id || userData?.data?._id;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset page when query changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: searchResults,
    isLoading,
    error
  } = useSearchMessagesQuery(
    {
      userId: userId || '',
      query: debouncedQuery,
      filters,
      page,
      limit: 20
    },
    { skip: !userId || !debouncedQuery.trim() }
  );

  const results = searchResults?.data?.data || [];
  const pagination = searchResults?.data?.pagination;

  const handleFilterChange = (key: keyof MessageFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const highlightText = (text: string, highlight?: string) => {
    if (!highlight) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getParticipantName = (result: MessageSearchResult) => {
    const message = result.message;
    const otherParticipant = message.sender._id === userId ? message.recipient : message.sender;
    return `${otherParticipant.name.firstName} ${otherParticipant.name.lastName}`;
  };

  const getParticipantAvatar = (result: MessageSearchResult) => {
    const message = result.message;
    const otherParticipant = message.sender._id === userId ? message.recipient : message.sender;
    return otherParticipant.profileImg || otherParticipant.photoUrl;
  };

  const getParticipantInitials = (result: MessageSearchResult) => {
    const message = result.message;
    const otherParticipant = message.sender._id === userId ? message.recipient : message.sender;
    return `${otherParticipant.name.firstName[0]}${otherParticipant.name.lastName[0]}`;
  };

  const renderSearchResult = (result: MessageSearchResult) => {
    const message = result.message;
    const hasAttachments = message.attachments?.length > 0;

    return (
      <div
        key={message._id}
        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage 
              src={getParticipantAvatar(result)} 
              alt={getParticipantName(result)} 
            />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
              {getParticipantInitials(result)}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-gray-900 truncate">
                  {highlightText(getParticipantName(result), result.highlights?.senderName)}
                </span>
                {message.isStarred && (
                  <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                )}
                {hasAttachments && (
                  <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <Badge variant="outline" className="text-xs">
                  {message.messageType.replace('_', ' ')}
                </Badge>
                {message.priority !== MessagePriority.NORMAL && (
                  <Badge 
                    variant={message.priority === MessagePriority.HIGH || message.priority === MessagePriority.URGENT ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {message.priority}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </span>
                <div className="flex items-center text-xs text-gray-400">
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                    {(result.relevanceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-800">
                {highlightText(message.subject, result.highlights?.subject)}
              </p>
            </div>

            {/* Content preview */}
            <div className="mb-2">
              <p className="text-sm text-gray-600 line-clamp-2">
                {highlightText(
                  message.content.substring(0, 200) + (message.content.length > 200 ? '...' : ''),
                  result.highlights?.content
                )}
              </p>
            </div>

            {/* Thread info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>Thread: {result.thread.messageCount} messages</span>
              </div>
              {result.thread.unreadCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span>{result.thread.unreadCount} unread</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(message.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages, subjects, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filters */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {Object.keys(filters).length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys(filters).length}
                    </Badge>
                  )}
                </div>
                {filtersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Type</label>
                  <Select
                    value={filters.messageType || 'all'}
                    onValueChange={(value) => handleFilterChange('messageType', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value={MessageType.DIRECT}>Direct</SelectItem>
                      <SelectItem value={MessageType.ANNOUNCEMENT}>Announcement</SelectItem>
                      <SelectItem value={MessageType.COURSE_DISCUSSION}>Course Discussion</SelectItem>
                      <SelectItem value={MessageType.ASSIGNMENT_FEEDBACK}>Assignment Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Priority</label>
                  <Select
                    value={filters.priority || 'all'}
                    onValueChange={(value) => handleFilterChange('priority', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value={MessagePriority.LOW}>Low</SelectItem>
                      <SelectItem value={MessagePriority.NORMAL}>Normal</SelectItem>
                      <SelectItem value={MessagePriority.HIGH}>High</SelectItem>
                      <SelectItem value={MessagePriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Read Status</label>
                  <Select
                    value={filters.isRead?.toString() || 'all'}
                    onValueChange={(value) => handleFilterChange('isRead', value === 'all' ? undefined : value === 'true')}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Messages</SelectItem>
                      <SelectItem value="false">Unread</SelectItem>
                      <SelectItem value="true">Read</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Starred</label>
                  <Select
                    value={filters.isStarred?.toString() || 'all'}
                    onValueChange={(value) => handleFilterChange('isStarred', value === 'all' ? undefined : value === 'true')}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Messages</SelectItem>
                      <SelectItem value="true">Starred</SelectItem>
                      <SelectItem value="false">Not Starred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {Object.keys(filters).length > 0 && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Results */}
          <div className="flex-1 overflow-hidden">
            {!debouncedQuery.trim() ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg font-medium mb-2">Search Messages</div>
                  <div className="text-sm">
                    Enter keywords to search through your messages
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg font-medium mb-2">No results found</div>
                  <div className="text-sm">
                    Try adjusting your search terms or filters
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-0">
                  {results.map(renderSearchResult)}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                {results.length} of {pagination.total} results
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
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
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
      </DialogContent>
    </Dialog>
  );
};

export default MessageSearch;
