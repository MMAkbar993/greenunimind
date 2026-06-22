import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Message,
  MessageThread,
  MessageFolder,
  MessageFilters,
  MessageDraft,
  TypingIndicator,
  FolderType,
  MessageType,
  MessagePriority
} from '@/types/message';

interface MessageState {
  // Current folder and filters
  currentFolder: FolderType;
  currentFolderId?: string;
  filters: MessageFilters;
  searchQuery: string;
  
  // UI state
  selectedThreadId?: string;
  selectedMessageIds: string[];
  isComposing: boolean;
  composeDraft?: Partial<MessageDraft>;
  
  // Real-time features
  typingIndicators: TypingIndicator[];
  onlineUsers: string[];
  
  // UI preferences
  messageListView: 'list' | 'compact' | 'comfortable';
  sidebarCollapsed: boolean;
  previewPaneVisible: boolean;
  
  // Notification settings
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  
  // Cache and performance
  lastRefresh: string | null;
  autoRefreshInterval: number; // in seconds
}

const initialState: MessageState = {
  currentFolder: FolderType.INBOX,
  filters: {},
  searchQuery: '',
  selectedMessageIds: [],
  isComposing: false,
  typingIndicators: [],
  onlineUsers: [],
  messageListView: 'comfortable',
  sidebarCollapsed: false,
  previewPaneVisible: true,
  notificationsEnabled: true,
  soundEnabled: true,
  desktopNotificationsEnabled: true,
  lastRefresh: null,
  autoRefreshInterval: 30,
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    // Folder and navigation
    setCurrentFolder: (state, action: PayloadAction<{ folderType: FolderType; folderId?: string }>) => {
      state.currentFolder = action.payload.folderType;
      state.currentFolderId = action.payload.folderId;
      state.selectedThreadId = undefined;
      state.selectedMessageIds = [];
    },

    // Filters and search
    setFilters: (state, action: PayloadAction<MessageFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = {};
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    // Thread and message selection
    setSelectedThread: (state, action: PayloadAction<string | undefined>) => {
      state.selectedThreadId = action.payload;
      state.selectedMessageIds = [];
    },

    toggleMessageSelection: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      const index = state.selectedMessageIds.indexOf(messageId);
      if (index > -1) {
        state.selectedMessageIds.splice(index, 1);
      } else {
        state.selectedMessageIds.push(messageId);
      }
    },

    selectAllMessages: (state, action: PayloadAction<string[]>) => {
      state.selectedMessageIds = action.payload;
    },

    clearMessageSelection: (state) => {
      state.selectedMessageIds = [];
    },

    // Compose functionality
    startComposing: (state, action: PayloadAction<Partial<MessageDraft> | undefined>) => {
      state.isComposing = true;
      state.composeDraft = action.payload || {
        recipientIds: [],
        subject: '',
        content: '',
        messageType: MessageType.DIRECT,
        priority: MessagePriority.NORMAL,
        attachments: [],
      };
    },

    updateComposeDraft: (state, action: PayloadAction<Partial<MessageDraft>>) => {
      if (state.composeDraft) {
        state.composeDraft = { ...state.composeDraft, ...action.payload };
      }
    },

    stopComposing: (state) => {
      state.isComposing = false;
      state.composeDraft = undefined;
    },

    // Real-time features
    addTypingIndicator: (state, action: PayloadAction<TypingIndicator>) => {
      const existing = state.typingIndicators.find(
        (indicator) => 
          indicator.threadId === action.payload.threadId && 
          indicator.userId === action.payload.userId
      );
      
      if (existing) {
        existing.isTyping = action.payload.isTyping;
        existing.timestamp = action.payload.timestamp;
      } else {
        state.typingIndicators.push(action.payload);
      }
    },

    removeTypingIndicator: (state, action: PayloadAction<{ threadId: string; userId: string }>) => {
      state.typingIndicators = state.typingIndicators.filter(
        (indicator) => 
          !(indicator.threadId === action.payload.threadId && 
            indicator.userId === action.payload.userId)
      );
    },

    clearTypingIndicators: (state, action: PayloadAction<string>) => {
      state.typingIndicators = state.typingIndicators.filter(
        (indicator) => indicator.threadId !== action.payload
      );
    },

    updateOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },

    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },

    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(userId => userId !== action.payload);
    },

    // UI preferences
    setMessageListView: (state, action: PayloadAction<'list' | 'compact' | 'comfortable'>) => {
      state.messageListView = action.payload;
    },

    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    togglePreviewPane: (state) => {
      state.previewPaneVisible = !state.previewPaneVisible;
    },

    setPreviewPaneVisible: (state, action: PayloadAction<boolean>) => {
      state.previewPaneVisible = action.payload;
    },

    // Notification settings
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },

    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },

    setDesktopNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.desktopNotificationsEnabled = action.payload;
    },

    // Cache and performance
    updateLastRefresh: (state) => {
      state.lastRefresh = new Date().toISOString();
    },

    setAutoRefreshInterval: (state, action: PayloadAction<number>) => {
      state.autoRefreshInterval = action.payload;
    },

    // Bulk actions
    performBulkAction: (state, action: PayloadAction<{
      action: 'read' | 'unread' | 'star' | 'unstar' | 'archive' | 'delete';
      messageIds: string[];
    }>) => {
      // This will be handled by the API calls, but we can update local state if needed
      if (action.payload.action === 'delete' || action.payload.action === 'archive') {
        state.selectedMessageIds = [];
      }
    },

    // Reset state
    resetMessageState: () => initialState,
  },
});

export const {
  setCurrentFolder,
  setFilters,
  clearFilters,
  setSearchQuery,
  setSelectedThread,
  toggleMessageSelection,
  selectAllMessages,
  clearMessageSelection,
  startComposing,
  updateComposeDraft,
  stopComposing,
  addTypingIndicator,
  removeTypingIndicator,
  clearTypingIndicators,
  updateOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setMessageListView,
  toggleSidebar,
  setSidebarCollapsed,
  togglePreviewPane,
  setPreviewPaneVisible,
  setNotificationsEnabled,
  setSoundEnabled,
  setDesktopNotificationsEnabled,
  updateLastRefresh,
  setAutoRefreshInterval,
  performBulkAction,
  resetMessageState,
} = messageSlice.actions;

export default messageSlice.reducer;
