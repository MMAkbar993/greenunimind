import React from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { startComposing } from '@/redux/features/message/messageSlice';
import { useGetMessageFoldersQuery, useGetMessageStatsQuery } from '@/redux/features/message/messageApi';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { FolderType, MessageFolder } from '@/types/message';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Inbox,
  Send,
  FileText,
  Star,
  Archive,
  Trash2,
  Plus,
  MessageSquare,
  Bell,
  Users,
  BookOpen,
  AlertCircle,
  PenTool,
  RefreshCw
} from 'lucide-react';

interface MessageSidebarProps {
  onFolderSelect: (folderType: FolderType, folderId?: string) => void;
  currentFolder: FolderType;
}

const MessageSidebar: React.FC<MessageSidebarProps> = ({
  onFolderSelect,
  currentFolder
}) => {
  const dispatch = useAppDispatch();
  const { data: userData } = useGetMeQuery(undefined);
  // For messaging, we need the User._id (not Teacher._id)
  // The Teacher document has a 'user' field that references the User._id
  const userId = userData?.data?.user?._id || userData?.data?._id;

  const {
    data: foldersData,
    isLoading: foldersLoading,
    error: foldersError
  } = useGetMessageFoldersQuery(userId || '', {
    skip: !userId
  });

  const {
    data: statsData,
    isLoading: statsLoading
  } = useGetMessageStatsQuery(
    { userId: userId || '', period: 'week' },
    { skip: !userId }
  );

  const folders = foldersData?.data || [];
  const stats = statsData?.data;

  const getFolderIcon = (folderType: FolderType) => {
    switch (folderType) {
      case FolderType.INBOX:
        return <Inbox className="h-4 w-4" />;
      case FolderType.SENT:
        return <Send className="h-4 w-4" />;
      case FolderType.DRAFTS:
        return <FileText className="h-4 w-4" />;
      case FolderType.STARRED:
        return <Star className="h-4 w-4" />;
      case FolderType.ARCHIVED:
        return <Archive className="h-4 w-4" />;
      case FolderType.TRASH:
        return <Trash2 className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getDefaultFolders = () => [
    {
      _id: 'inbox',
      name: 'Inbox',
      type: FolderType.INBOX,
      messageCount: stats?.totalMessages || 0,
      unreadCount: stats?.unreadMessages || 0,
      isDefault: true,
      createdAt: '',
      updatedAt: ''
    },
    {
      _id: 'sent',
      name: 'Sent',
      type: FolderType.SENT,
      messageCount: stats?.sentMessages || 0,
      unreadCount: 0,
      isDefault: true,
      createdAt: '',
      updatedAt: ''
    },
    {
      _id: 'drafts',
      name: 'Drafts',
      type: FolderType.DRAFTS,
      messageCount: 0,
      unreadCount: 0,
      isDefault: true,
      createdAt: '',
      updatedAt: ''
    },
    {
      _id: 'starred',
      name: 'Starred',
      type: FolderType.STARRED,
      messageCount: stats?.starredMessages || 0,
      unreadCount: 0,
      isDefault: true,
      createdAt: '',
      updatedAt: ''
    },
    {
      _id: 'archived',
      name: 'Archived',
      type: FolderType.ARCHIVED,
      messageCount: stats?.archivedMessages || 0,
      unreadCount: 0,
      isDefault: true,
      createdAt: '',
      updatedAt: ''
    },
    {
      _id: 'trash',
      name: 'Trash',
      type: FolderType.TRASH,
      messageCount: 0,
      unreadCount: 0,
      isDefault: true,
      createdAt: '',
      updatedAt: ''
    }
  ];

  const defaultFolders = getDefaultFolders();
  const customFolders = folders.filter(folder => folder.type === FolderType.CUSTOM);

  const handleComposeClick = () => {
    dispatch(startComposing(undefined));
  };

  const renderFolderItem = (folder: MessageFolder) => {
    const isActive = currentFolder === folder.type;
    
    return (
      <button
        key={folder._id}
        onClick={() => onFolderSelect(folder.type, folder._id)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
          "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          isActive && "bg-blue-50 text-blue-700 border border-blue-200"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "flex-shrink-0",
            isActive ? "text-blue-600" : "text-gray-500"
          )}>
            {getFolderIcon(folder.type)}
          </div>
          <span className={cn(
            "font-medium truncate",
            isActive ? "text-blue-700" : "text-gray-700"
          )}>
            {folder.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {folder.unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="h-5 min-w-[20px] text-xs px-1.5"
            >
              {folder.unreadCount > 99 ? '99+' : folder.unreadCount}
            </Badge>
          )}
          {folder.messageCount > 0 && folder.unreadCount === 0 && (
            <span className="text-xs text-gray-500">
              {folder.messageCount}
            </span>
          )}
        </div>
      </button>
    );
  };

  if (foldersLoading || statsLoading) {
    return (
      <div className="h-full bg-white border-r border-gray-200 p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (foldersError) {
    return (
      <div className="h-full bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load folders</span>
        </div>
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 mb-4">
            Don't worry - this is likely a temporary issue.
          </p>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Compose button */}
      <div className="p-4 border-b border-gray-200">
        <Button 
          onClick={handleComposeClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <PenTool className="h-4 w-4 mr-2" />
          Compose
        </Button>
      </div>

      {/* Folders */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {/* Default folders */}
          <div className="space-y-1">
            {defaultFolders.map(renderFolderItem)}
          </div>

          {/* Custom folders */}
          {customFolders.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Custom Folders
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {customFolders.map(renderFolderItem)}
              </div>
            </>
          )}

          {/* Quick filters */}
          <Separator className="my-4" />
          <div className="space-y-1">
            <div className="px-3 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Filters
              </span>
            </div>
            
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Announcements</span>
            </button>
            
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Student Messages</span>
            </button>
            
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Course Related</span>
            </button>
          </div>
        </div>
      </ScrollArea>

      {/* Stats summary */}
      {stats && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Total Messages:</span>
              <span className="font-medium">{stats.totalMessages}</span>
            </div>
            <div className="flex justify-between">
              <span>Unread:</span>
              <span className="font-medium text-blue-600">{stats.unreadMessages}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSidebar;
