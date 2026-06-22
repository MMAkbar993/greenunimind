import React, { useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Eye,
  ThumbsUp,
  Star,
  ArrowLeft,
  ExternalLink,
  Share,
  Bookmark,
  Tag,
  User,
  Calendar,
  TrendingUp,
  Grid,
  List,
  FileText
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

// Import types
import type { 
  KnowledgeBaseBrowserProps,
  KnowledgeBaseCategory,
  KnowledgeBaseArticle 
} from '@/types/help-support';

// Import hooks

// Mock data
const mockCategories: KnowledgeBaseCategory[] = [
  {
    id: '1',
    name: 'Getting Started',
    description: 'Essential guides for new users',
    icon: '🚀',
    articleCount: 12,
    order: 1,
    isActive: true,
    slug: 'getting-started'
  },
  {
    id: '2',
    name: 'Course Management',
    description: 'Creating and managing your courses',
    icon: '📚',
    articleCount: 25,
    order: 2,
    isActive: true,
    slug: 'course-management'
  },
  {
    id: '3',
    name: 'Student Engagement',
    description: 'Tips for engaging with students',
    icon: '👥',
    articleCount: 18,
    order: 3,
    isActive: true,
    slug: 'student-engagement'
  },
  {
    id: '4',
    name: 'Analytics & Reports',
    description: 'Understanding your performance data',
    icon: '📊',
    articleCount: 15,
    order: 4,
    isActive: true,
    slug: 'analytics-reports'
  },
  {
    id: '5',
    name: 'Technical Support',
    description: 'Troubleshooting and technical guides',
    icon: '🔧',
    articleCount: 22,
    order: 5,
    isActive: true,
    slug: 'technical-support'
  }
];

const mockArticles: KnowledgeBaseArticle[] = [
  {
    id: '1',
    title: 'How to Create Your First Course',
    content: 'This comprehensive guide will walk you through creating your first course...',
    excerpt: 'Learn the step-by-step process of creating your first course on our platform.',
    slug: 'how-to-create-first-course',
    categoryId: '1',
    category: mockCategories[0],
    tags: ['course creation', 'getting started', 'tutorial'],
    author: {
      _id: 'author1',
      name: { firstName: 'Sarah', lastName: 'Johnson' },
      email: 'sarah@example.com',
      role: 'admin'
    },
    isPublished: true,
    isFeatured: true,
    views: 2450,
    helpfulCount: 189,
    notHelpfulCount: 12,
    estimatedReadTime: 8,
    lastUpdated: '2024-01-15T10:30:00Z',
    createdAt: '2023-12-01T09:00:00Z',
    publishedAt: '2023-12-01T09:00:00Z',
    tableOfContents: [
      { id: '1', title: 'Introduction', level: 1, anchor: 'introduction' },
      { id: '2', title: 'Setting up your course', level: 1, anchor: 'setup' },
      { id: '3', title: 'Adding content', level: 2, anchor: 'content' },
      { id: '4', title: 'Publishing your course', level: 1, anchor: 'publishing' }
    ]
  },
  {
    id: '2',
    title: 'Understanding Course Analytics',
    content: 'Analytics provide valuable insights into your course performance...',
    excerpt: 'Learn how to interpret and use your course analytics to improve performance.',
    slug: 'understanding-course-analytics',
    categoryId: '4',
    category: mockCategories[3],
    tags: ['analytics', 'performance', 'data'],
    author: {
      _id: 'author2',
      name: { firstName: 'Mike', lastName: 'Chen' },
      email: 'mike@example.com',
      role: 'admin'
    },
    isPublished: true,
    isFeatured: false,
    views: 1820,
    helpfulCount: 156,
    notHelpfulCount: 8,
    estimatedReadTime: 12,
    lastUpdated: '2024-01-10T14:20:00Z',
    createdAt: '2023-11-15T11:30:00Z',
    publishedAt: '2023-11-15T11:30:00Z'
  },
  {
    id: '3',
    title: 'Best Practices for Video Content',
    content: 'Creating engaging video content is crucial for student success...',
    excerpt: 'Tips and best practices for creating high-quality video content for your courses.',
    slug: 'best-practices-video-content',
    categoryId: '2',
    category: mockCategories[1],
    tags: ['video', 'content creation', 'best practices'],
    author: {
      _id: 'author3',
      name: { firstName: 'Emily', lastName: 'Davis' },
      email: 'emily@example.com',
      role: 'admin'
    },
    isPublished: true,
    isFeatured: true,
    views: 3200,
    helpfulCount: 245,
    notHelpfulCount: 15,
    estimatedReadTime: 15,
    lastUpdated: '2024-01-08T16:45:00Z',
    createdAt: '2023-11-20T13:15:00Z',
    publishedAt: '2023-11-20T13:15:00Z'
  }
];

const KnowledgeBaseBrowser: React.FC<KnowledgeBaseBrowserProps> = ({
  searchQuery = '',
  categoryFilter = '',
  onArticleSelect
}) => {
  // State management
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'popularity' | 'recent'>('relevance');
  const [isLoading, setIsLoading] = useState(false);

  // Simple announce function for accessibility
  const announce = useCallback((message: string) => {
    console.log('Accessibility announcement:', message);
  }, []);

  // Filter and search articles
  const filteredArticles = useMemo(() => {
    let filtered = [...mockArticles];

    // Apply search filter
    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.categoryId === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => (b.views + b.helpfulCount) - (a.views + a.helpfulCount));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
      default: // relevance
        if (localSearchQuery) {
          // Sort by relevance when searching
          filtered.sort((a, b) => {
            const aScore = calculateRelevanceScore(a, localSearchQuery);
            const bScore = calculateRelevanceScore(b, localSearchQuery);
            return bScore - aScore;
          });
        } else {
          // Sort by featured and popularity when not searching
          filtered.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return (b.views + b.helpfulCount) - (a.views + a.helpfulCount);
          });
        }
        break;
    }

    return filtered;
  }, [localSearchQuery, selectedCategory, sortBy]);

  // Calculate relevance score
  const calculateRelevanceScore = (article: KnowledgeBaseArticle, query: string): number => {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    if (article.title.toLowerCase().includes(lowerQuery)) score += 10;
    if (article.excerpt.toLowerCase().includes(lowerQuery)) score += 5;
    if (article.content.toLowerCase().includes(lowerQuery)) score += 3;
    
    article.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) score += 2;
    });

    score += Math.log(article.views + 1) * 0.1;
    return score;
  };

  // Handle article selection
  const handleArticleSelect = useCallback((article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    onArticleSelect?.(article);
    announce(`Opened article: ${article.title}`);
  }, [onArticleSelect, announce]);

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setSelectedArticle(null);
    announce('Returned to article list');
  }, [announce]);

  // Format read time
  const formatReadTime = (minutes: number) => {
    return `${minutes} min read`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If article is selected, show article view
  if (selectedArticle) {
    return (
      <ArticleView 
        article={selectedArticle}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Knowledge Base
          </h2>
          <p className="text-gray-600">
            Browse our comprehensive documentation and guides
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search knowledge base articles"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {mockCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Overview */}
      {!localSearchQuery && !selectedCategory && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockCategories.map(category => (
            <Card 
              key={category.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{category.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {category.articleCount} articles
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Articles List */}
      {(localSearchQuery || selectedCategory) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
            </p>
            
            {selectedCategory && (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedCategory('');
                      }}
                    >
                      All Categories
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {mockCategories.find(c => c.id === selectedCategory)?.name}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>

          {viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map(article => (
                <ArticleCard 
                  key={article.id}
                  article={article}
                  onClick={() => handleArticleSelect(article)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map(article => (
                <ArticleListItem 
                  key={article.id}
                  article={article}
                  onClick={() => handleArticleSelect(article)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Featured Articles */}
      {!localSearchQuery && !selectedCategory && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Featured Articles</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockArticles
              .filter(article => article.isFeatured)
              .map(article => (
                <ArticleCard 
                  key={article.id}
                  article={article}
                  onClick={() => handleArticleSelect(article)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Article Card Component
interface ArticleCardProps {
  article: KnowledgeBaseArticle;
  onClick: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 h-full"
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <Badge variant="outline" className="text-xs">
              {article.category?.icon} {article.category?.name}
            </Badge>
            {article.isFeatured && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {article.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.estimatedReadTime} min
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.views}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {article.helpfulCount}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Article List Item Component
interface ArticleListItemProps {
  article: KnowledgeBaseArticle;
  onClick: () => void;
}

const ArticleListItem: React.FC<ArticleListItemProps> = ({ article, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {article.category?.icon} {article.category?.name}
              </Badge>
              {article.isFeatured && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2">
              {article.title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-3">
              {article.excerpt}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.estimatedReadTime} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.views} views
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {article.helpfulCount} helpful
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Updated {new Date(article.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
};

// Article View Component
interface ArticleViewProps {
  article: KnowledgeBaseArticle;
  onBack: () => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Button>
        
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>
                Knowledge Base
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {article.category?.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{article.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Article Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">
                  {article.category?.icon} {article.category?.name}
                </Badge>
                {article.isFeatured && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-2xl mb-4">
                {article.title}
              </CardTitle>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {article.author.name.firstName} {article.author.name.lastName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.lastUpdated).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.estimatedReadTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {article.views} views
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Table of Contents */}
          {article.tableOfContents && article.tableOfContents.length > 0 && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3">Table of Contents</h4>
              <ul className="space-y-1">
                {article.tableOfContents.map(item => (
                  <li key={item.id} className={cn("text-sm", item.level === 2 && "ml-4")}>
                    <a 
                      href={`#${item.anchor}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Article Content */}
          <div className="prose prose-sm max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              {article.excerpt}
            </p>
            
            <div className="whitespace-pre-wrap">
              {article.content}
            </div>
          </div>
          
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Tags:</span>
              {article.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Helpful Voting */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Was this article helpful?</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Yes ({article.helpfulCount})
                </Button>
                <Button variant="outline" size="sm">
                  <ThumbsUp className="w-4 h-4 mr-1 rotate-180" />
                  No ({article.notHelpfulCount})
                </Button>
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" />
              Share Article
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBaseBrowser;
