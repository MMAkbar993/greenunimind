// Help & Support System Types
// Comprehensive TypeScript interfaces for the LMS Help & Support system

export interface User {
  _id: string;
  name: {
    firstName: string;
    lastName: string;
    middleName?: string;
  };
  email: string;
  role: 'teacher' | 'student' | 'admin';
  avatar?: string;
}

// FAQ System Types
export interface FAQCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  categoryId: string;
  category?: FAQCategory;
  tags: string[];
  isPopular: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  views: number;
  lastUpdated: string;
  createdAt: string;
  order: number;
  isActive: boolean;
  searchKeywords?: string[];
}

export interface FAQSearchFilters {
  category?: string;
  tags?: string[];
  popular?: boolean;
  sortBy?: 'relevance' | 'popularity' | 'recent' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

export interface FAQSearchResult {
  items: FAQItem[];
  total: number;
  categories: FAQCategory[];
  popularTags: string[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Support Ticket System Types
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in-progress' | 'waiting-response' | 'resolved' | 'closed';
export type TicketCategory = 'technical' | 'billing' | 'course-content' | 'account' | 'feature-request' | 'bug-report' | 'other';

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TicketMessage {
  id: string;
  content: string;
  author: User;
  isInternal: boolean;
  attachments: TicketAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  submittedBy: User;
  assignedTo?: User;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
  tags: string[];
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  lastActivity: string;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  search?: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  averageResolutionTime: number;
  satisfactionScore: number;
  responseTime: {
    average: number;
    target: number;
  };
}

// Contact Form Types
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  message: string;
  attachments: File[];
  userAgent?: string;
  currentUrl?: string;
  userId?: string;
}

export interface ContactFormValidation {
  name: string[];
  email: string[];
  subject: string[];
  category: string[];
  message: string[];
  attachments: string[];
}

// Knowledge Base Types
export interface KnowledgeBaseCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  children?: KnowledgeBaseCategory[];
  articleCount: number;
  order: number;
  isActive: boolean;
  slug: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  categoryId: string;
  category?: KnowledgeBaseCategory;
  tags: string[];
  author: User;
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  estimatedReadTime: number;
  lastUpdated: string;
  createdAt: string;
  publishedAt?: string;
  relatedArticles?: string[];
  searchKeywords?: string[];
  tableOfContents?: {
    id: string;
    title: string;
    level: number;
    anchor: string;
  }[];
}

export interface KnowledgeBaseSearchFilters {
  category?: string;
  tags?: string[];
  featured?: boolean;
  sortBy?: 'relevance' | 'popularity' | 'recent' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

export interface KnowledgeBaseSearchResult {
  articles: KnowledgeBaseArticle[];
  total: number;
  categories: KnowledgeBaseCategory[];
  popularTags: string[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Video Tutorials Types
export interface VideoTutorialCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  videoCount: number;
}

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number; // in seconds
  categoryId: string;
  category?: VideoTutorialCategory;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  likes: number;
  dislikes: number;
  transcript?: string;
  chapters?: {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
  }[];
  relatedVideos?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface VideoProgress {
  userId: string;
  videoId: string;
  watchedDuration: number;
  totalDuration: number;
  isCompleted: boolean;
  lastWatchedAt: string;
  completedAt?: string;
}

// Download Center Types
export interface DownloadCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  fileCount: number;
}

export interface DownloadableFile {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  categoryId: string;
  category?: DownloadCategory;
  tags: string[];
  version: string;
  isPublished: boolean;
  isFeatured: boolean;
  downloadCount: number;
  lastUpdated: string;
  createdAt: string;
  publishedAt?: string;
  requirements?: string[];
  changelog?: string;
}

export interface DownloadHistory {
  id: string;
  userId: string;
  fileId: string;
  file?: DownloadableFile;
  downloadedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Live Chat Types
export interface ChatSession {
  id: string;
  userId: string;
  user: User;
  agentId?: string;
  agent?: User;
  status: 'waiting' | 'active' | 'ended';
  messages: ChatMessage[];
  startedAt: string;
  endedAt?: string;
  waitTime?: number;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  sender: User;
  isFromAgent: boolean;
  attachments: TicketAttachment[];
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'file' | 'system';
}

export interface ChatSettings {
  isEnabled: boolean;
  operatingHours: {
    start: string;
    end: string;
    timezone: string;
    days: string[];
  };
  maxConcurrentChats: number;
  averageWaitTime: number;
  autoAssignment: boolean;
  welcomeMessage: string;
  offlineMessage: string;
}

// Search Types
export interface GlobalSearchFilters {
  type?: ('faq' | 'article' | 'video' | 'download' | 'ticket')[];
  category?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'relevance' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface GlobalSearchResult {
  query: string;
  results: {
    faq: FAQItem[];
    articles: KnowledgeBaseArticle[];
    videos: VideoTutorial[];
    downloads: DownloadableFile[];
    tickets: SupportTicket[];
  };
  total: number;
  suggestions: string[];
  filters: GlobalSearchFilters;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Analytics Types
export interface HelpSupportAnalytics {
  overview: {
    totalTickets: number;
    resolvedTickets: number;
    averageResolutionTime: number;
    satisfactionScore: number;
    popularSearchTerms: string[];
    topCategories: string[];
  };
  tickets: {
    byStatus: Record<TicketStatus, number>;
    byPriority: Record<TicketPriority, number>;
    byCategory: Record<TicketCategory, number>;
    resolutionTrend: {
      date: string;
      resolved: number;
      created: number;
    }[];
  };
  content: {
    mostViewedFAQs: FAQItem[];
    mostViewedArticles: KnowledgeBaseArticle[];
    mostWatchedVideos: VideoTutorial[];
    mostDownloadedFiles: DownloadableFile[];
  };
  search: {
    topQueries: {
      query: string;
      count: number;
      resultsFound: number;
    }[];
    noResultsQueries: string[];
    searchTrends: {
      date: string;
      searches: number;
      successRate: number;
    }[];
  };
}

// Component Props Types
export interface HelpSupportPageProps {
  initialTab?: string;
  searchQuery?: string;
}

export interface FAQSectionProps {
  searchQuery?: string;
  categoryFilter?: string;
  onSearchChange?: (query: string) => void;
}

export interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<ContactFormData>;
}

export interface KnowledgeBaseBrowserProps {
  searchQuery?: string;
  categoryFilter?: string;
  onArticleSelect?: (article: KnowledgeBaseArticle) => void;
}

export interface SupportTicketListProps {
  filters?: TicketFilters;
  onTicketSelect?: (ticket: SupportTicket) => void;
  onFiltersChange?: (filters: TicketFilters) => void;
}

export interface VideoTutorialsProps {
  searchQuery?: string;
  categoryFilter?: string;
  onVideoSelect?: (video: VideoTutorial) => void;
}

export interface DownloadCenterProps {
  searchQuery?: string;
  categoryFilter?: string;
  onDownload?: (file: DownloadableFile) => void;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface APIError {
  success: false;
  message: string;
  errors?: string[];
  code?: string;
  statusCode?: number;
}
