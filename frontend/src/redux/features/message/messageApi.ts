import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import {
  Message,
  MessageThread,
  MessageFolder,
  MessageStats,
  MessageFilters,
  MessageSearchResult,
  ComposeMessageData,
  MessageNotification,
  MessageDraft,
  MessageApiResponse,
  PaginatedMessageResponse,
  FolderType,

} from "@/types/message";

export const messageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get message folders
    getMessageFolders: builder.query<
      MessageApiResponse<MessageFolder[]>,
      string
    >({
      query: (userId) => ({
        url: `/messaging/users/${userId}/folders`,
        method: "GET",
      }),
      providesTags: ["analytics"],
      transformResponse: (response: TResponseRedux<MessageFolder[]>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
      transformErrorResponse: (response: any) => {
        // Handle 404 errors gracefully for new users
        if (response.status === 404) {
          return {
            success: true,
            message: 'No folders found',
            data: []
          };
        }
        return response;
      },
    }),

    // Get messages by folder
    getMessagesByFolder: builder.query<
      MessageApiResponse<PaginatedMessageResponse<MessageThread>>,
      { 
        userId: string; 
        folderId?: string; 
        folderType?: FolderType;
        page?: number; 
        limit?: number; 
        filters?: MessageFilters 
      }
    >({
      query: ({ userId, folderId, folderType, page = 1, limit = 20, filters }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        
        if (folderId) params.append('folderId', folderId);
        if (folderType) params.append('folderType', folderType);
        if (filters?.messageType) params.append('messageType', filters.messageType);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
        if (filters?.isStarred !== undefined) params.append('isStarred', filters.isStarred.toString());
        if (filters?.senderId) params.append('senderId', filters.senderId);
        if (filters?.courseId) params.append('courseId', filters.courseId);
        if (filters?.searchQuery) params.append('search', filters.searchQuery);
        if (filters?.dateRange?.startDate) params.append('startDate', filters.dateRange.startDate);
        if (filters?.dateRange?.endDate) params.append('endDate', filters.dateRange.endDate);

        return {
          url: `/messaging/users/${userId}/threads?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["analytics"],
      transformResponse: (response: TResponseRedux<any>) => ({
        success: response.success,
        message: response.message,
        data: {
          data: response.data.threads || [],
          pagination: response.data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      }),
    }),

    // Get thread messages
    getThreadMessages: builder.query<
      MessageApiResponse<PaginatedMessageResponse<Message>>,
      { threadId: string; page?: number; limit?: number }
    >({
      query: ({ threadId, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        return {
          url: `/messaging/conversations/${threadId}/messages?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["analytics"],
      transformResponse: (response: TResponseRedux<any>) => ({
        success: response.success,
        message: response.message,
        data: {
          data: response.data.messages || [],
          pagination: response.data.pagination || {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      }),
    }),

    // Send message
    sendMessage: builder.mutation<
      MessageApiResponse<Message>,
      ComposeMessageData
    >({
      query: (messageData) => ({
        url: `/messages/send`,
        method: "POST",
        body: messageData,
      }),
      invalidatesTags: ["analytics"],
      transformResponse: (response: TResponseRedux<Message>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
    }),

    // Reply to message
    replyToMessage: builder.mutation<
      MessageApiResponse<Message>,
      { threadId: string; content: string; attachments?: File[] }
    >({
      query: ({ threadId, content, attachments }) => ({
        url: `/messages/threads/${threadId}/reply`,
        method: "POST",
        body: { content, attachments },
      }),
      invalidatesTags: ["analytics"],
    }),

    // Mark messages as read
    markMessagesAsRead: builder.mutation<
      MessageApiResponse<null>,
      { messageIds: string[] }
    >({
      query: ({ messageIds }) => ({
        url: `/messages/mark-read`,
        method: "PATCH",
        body: { messageIds },
      }),
      invalidatesTags: ["analytics"],
    }),

    // Mark thread as read
    markThreadAsRead: builder.mutation<
      MessageApiResponse<null>,
      { threadId: string }
    >({
      query: ({ threadId }) => ({
        url: `/messages/threads/${threadId}/mark-read`,
        method: "PATCH",
      }),
      invalidatesTags: ["analytics"],
    }),

    // Star/unstar message
    toggleMessageStar: builder.mutation<
      MessageApiResponse<Message>,
      { messageId: string; isStarred: boolean }
    >({
      query: ({ messageId, isStarred }) => ({
        url: `/messages/${messageId}/star`,
        method: "PATCH",
        body: { isStarred },
      }),
      invalidatesTags: ["analytics"],
    }),

    // Archive/unarchive thread
    toggleThreadArchive: builder.mutation<
      MessageApiResponse<MessageThread>,
      { threadId: string; isArchived: boolean }
    >({
      query: ({ threadId, isArchived }) => ({
        url: `/messages/threads/${threadId}/archive`,
        method: "PATCH",
        body: { isArchived },
      }),
      invalidatesTags: ["analytics"],
    }),

    // Delete messages
    deleteMessages: builder.mutation<
      MessageApiResponse<null>,
      { messageIds: string[]; permanent?: boolean }
    >({
      query: ({ messageIds, permanent = false }) => ({
        url: `/messages/delete`,
        method: "DELETE",
        body: { messageIds, permanent },
      }),
      invalidatesTags: ["analytics"],
    }),

    // Search messages
    searchMessages: builder.query<
      MessageApiResponse<PaginatedMessageResponse<MessageSearchResult>>,
      { 
        userId: string; 
        query: string; 
        filters?: MessageFilters; 
        page?: number; 
        limit?: number 
      }
    >({
      query: ({ userId, query, filters, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        params.append('q', query);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        
        if (filters?.messageType) params.append('messageType', filters.messageType);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.courseId) params.append('courseId', filters.courseId);
        if (filters?.dateRange?.startDate) params.append('startDate', filters.dateRange.startDate);
        if (filters?.dateRange?.endDate) params.append('endDate', filters.dateRange.endDate);

        return {
          url: `/messaging/users/${userId}/search?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["analytics"],
    }),

    // Get message statistics
    getMessageStats: builder.query<
      MessageApiResponse<MessageStats>,
      { userId: string; period?: string }
    >({
      query: ({ userId, period = 'month' }) => ({
        url: `/messaging/users/${userId}/stats?period=${period}`,
        method: "GET",
      }),
      providesTags: ["analytics"],
      transformResponse: (response: TResponseRedux<MessageStats>) => ({
        success: response.success,
        message: response.message,
        data: response.data,
      }),
      transformErrorResponse: (response: any) => {
        // Handle 404 errors gracefully for new users
        if (response.status === 404) {
          return {
            success: true,
            message: 'No message stats found',
            data: {
              totalMessages: 0,
              unreadMessages: 0,
              sentMessages: 0,
              receivedMessages: 0,
              averageResponseTime: 0,
              period: 'month'
            }
          };
        }
        return response;
      },
    }),

    // Get notifications
    getNotifications: builder.query<
      MessageApiResponse<PaginatedMessageResponse<MessageNotification>>,
      { userId: string; page?: number; limit?: number; unreadOnly?: boolean }
    >({
      query: ({ userId, page = 1, limit = 20, unreadOnly = false }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (unreadOnly) params.append('unreadOnly', 'true');

        return {
          url: `/messages/users/${userId}/notifications?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["analytics"],
    }),

    // Mark notifications as read
    markNotificationsAsRead: builder.mutation<
      MessageApiResponse<null>,
      { notificationIds: string[] }
    >({
      query: ({ notificationIds }) => ({
        url: `/messages/notifications/mark-read`,
        method: "PATCH",
        body: { notificationIds },
      }),
      invalidatesTags: ["analytics"],
    }),

    // Save draft
    saveDraft: builder.mutation<
      MessageApiResponse<MessageDraft>,
      Partial<ComposeMessageData> & { draftId?: string }
    >({
      query: ({ draftId, ...draftData }) => ({
        url: draftId ? `/messages/drafts/${draftId}` : `/messages/drafts`,
        method: draftId ? "PUT" : "POST",
        body: draftData,
      }),
      invalidatesTags: ["analytics"],
    }),

    // Get drafts
    getDrafts: builder.query<
      MessageApiResponse<PaginatedMessageResponse<MessageDraft>>,
      { userId: string; page?: number; limit?: number }
    >({
      query: ({ userId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        return {
          url: `/messages/users/${userId}/drafts?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["analytics"],
    }),

    // Delete draft
    deleteDraft: builder.mutation<
      MessageApiResponse<null>,
      { draftId: string }
    >({
      query: ({ draftId }) => ({
        url: `/messages/drafts/${draftId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["analytics"],
    }),
  }),
});

export const {
  useGetMessageFoldersQuery,
  useGetMessagesByFolderQuery,
  useGetThreadMessagesQuery,
  useSendMessageMutation,
  useReplyToMessageMutation,
  useMarkMessagesAsReadMutation,
  useMarkThreadAsReadMutation,
  useToggleMessageStarMutation,
  useToggleThreadArchiveMutation,
  useDeleteMessagesMutation,
  useSearchMessagesQuery,
  useGetMessageStatsQuery,
  useGetNotificationsQuery,
  useMarkNotificationsAsReadMutation,
  useSaveDraftMutation,
  useGetDraftsQuery,
  useDeleteDraftMutation,
} = messageApi;
