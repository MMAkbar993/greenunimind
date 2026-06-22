import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Tag,
  Star,
  Clock,
  TrendingUp,
  HelpCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Import types
import type { 
  FAQSectionProps, 
  FAQItem, 
  FAQCategory, 
  FAQSearchFilters,
  FAQSearchResult 
} from '@/types/help-support';

// Import hooks

// Mock data - would come from API
const mockFAQCategories: FAQCategory[] = [
  { id: '1', name: 'Getting Started', description: 'Basic setup and onboarding', icon: '🚀', order: 1, isActive: true },
  { id: '2', name: 'Course Creation', description: 'Creating and managing courses', icon: '📚', order: 2, isActive: true },
  { id: '3', name: 'Payment & Billing', description: 'Payment issues and billing questions', icon: '💳', order: 3, isActive: true },
  { id: '4', name: 'Technical Issues', description: 'Technical problems and troubleshooting', icon: '🔧', order: 4, isActive: true },
  { id: '5', name: 'Account Management', description: 'Profile and account settings', icon: '👤', order: 5, isActive: true },
];

const mockFAQItems: FAQItem[] = [
  {
    id: '1',
    question: 'How do I create my first course?',
    answer: 'To create your first course, navigate to the "Courses" section in your dashboard and click "Create New Course". Follow the step-by-step wizard to add your course content, set pricing, and publish.',
    categoryId: '2',
    category: mockFAQCategories[1],
    tags: ['course creation', 'getting started', 'tutorial'],
    isPopular: true,
    helpfulCount: 245,
    notHelpfulCount: 12,
    views: 1250,
    lastUpdated: '2024-01-15T10:30:00Z',
    createdAt: '2023-12-01T09:00:00Z',
    order: 1,
    isActive: true,
    searchKeywords: ['create course', 'new course', 'first course', 'course wizard']
  },
  {
    id: '2',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. Payments are processed securely through Stripe.',
    categoryId: '3',
    category: mockFAQCategories[2],
    tags: ['payment', 'billing', 'credit card', 'paypal'],
    isPopular: true,
    helpfulCount: 189,
    notHelpfulCount: 8,
    views: 980,
    lastUpdated: '2024-01-10T14:20:00Z',
    createdAt: '2023-11-15T11:30:00Z',
    order: 2,
    isActive: true,
    searchKeywords: ['payment methods', 'credit card', 'paypal', 'stripe']
  },
  {
    id: '3',
    question: 'How do I upload videos to my course?',
    answer: 'You can upload videos directly through our course editor. We support MP4, MOV, and AVI formats up to 2GB per file. For larger files, we recommend using our bulk upload feature.',
    categoryId: '2',
    category: mockFAQCategories[1],
    tags: ['video upload', 'course content', 'file formats'],
    isPopular: false,
    helpfulCount: 156,
    notHelpfulCount: 15,
    views: 720,
    lastUpdated: '2024-01-08T16:45:00Z',
    createdAt: '2023-11-20T13:15:00Z',
    order: 3,
    isActive: true,
    searchKeywords: ['upload video', 'video format', 'course video', 'bulk upload']
  },
  {
    id: '4',
    question: 'Why can\'t I access my dashboard?',
    answer: 'If you\'re having trouble accessing your dashboard, try clearing your browser cache and cookies. If the issue persists, check if you\'re using the correct login credentials or contact support.',
    categoryId: '4',
    category: mockFAQCategories[3],
    tags: ['login issues', 'dashboard', 'troubleshooting'],
    isPopular: false,
    helpfulCount: 98,
    notHelpfulCount: 22,
    views: 450,
    lastUpdated: '2024-01-05T12:00:00Z',
    createdAt: '2023-11-10T10:45:00Z',
    order: 4,
    isActive: true,
    searchKeywords: ['dashboard access', 'login problem', 'can\'t login', 'access denied']
  },
  {
    id: '5',
    question: 'How do I change my profile information?',
    answer: 'To update your profile, go to Settings > Profile in your dashboard. You can change your name, email, bio, and profile picture. Remember to save your changes.',
    categoryId: '5',
    category: mockFAQCategories[4],
    tags: ['profile', 'settings', 'account'],
    isPopular: false,
    helpfulCount: 134,
    notHelpfulCount: 7,
    views: 620,
    lastUpdated: '2024-01-12T09:30:00Z',
    createdAt: '2023-12-05T14:20:00Z',
    order: 5,
    isActive: true,
    searchKeywords: ['change profile', 'update profile', 'edit profile', 'profile settings']
  }
];

const FAQSection: React.FC<FAQSectionProps> = ({ 
  searchQuery = '',
  categoryFilter = '',
  onSearchChange 
}) => {
  // State management
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [sortBy, setSortBy] = useState<'relevance' | 'popularity' | 'recent'>('relevance');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, 'helpful' | 'not-helpful' | null>>({});

  // Simple announce function for accessibility
  const announce = useCallback((message: string) => {
    console.log('Accessibility announcement:', message);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange && localSearchQuery !== searchQuery) {
        onSearchChange(localSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery, onSearchChange]);

  // Filter and search FAQs
  const filteredFAQs = useMemo(() => {
    let filtered = [...mockFAQItems];

    // Apply search filter
    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.tags.some(tag => tag.toLowerCase().includes(query)) ||
        faq.searchKeywords?.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.categoryId === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => (b.helpfulCount + b.views) - (a.helpfulCount + a.views));
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
          // Sort by popularity when not searching
          filtered.sort((a, b) => (b.helpfulCount + b.views) - (a.helpfulCount + a.views));
        }
        break;
    }

    return filtered;
  }, [localSearchQuery, selectedCategory, sortBy]);

  // Calculate relevance score for search
  const calculateRelevanceScore = (faq: FAQItem, query: string): number => {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Question title match (highest weight)
    if (faq.question.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }

    // Answer content match
    if (faq.answer.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }

    // Tags match
    faq.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) {
        score += 3;
      }
    });

    // Keywords match
    faq.searchKeywords?.forEach(keyword => {
      if (keyword.toLowerCase().includes(lowerQuery)) {
        score += 2;
      }
    });

    // Popularity boost
    score += Math.log(faq.helpfulCount + 1) * 0.1;

    return score;
  };

  // Handle FAQ item expansion
  const handleItemToggle = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const isExpanded = prev.includes(itemId);
      const newExpanded = isExpanded 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      const faq = mockFAQItems.find(f => f.id === itemId);
      if (faq) {
        announce(isExpanded ? `Collapsed ${faq.question}` : `Expanded ${faq.question}`);
      }
      
      return newExpanded;
    });
  }, [announce]);

  // Handle helpful vote
  const handleHelpfulVote = useCallback((faqId: string, isHelpful: boolean) => {
    setHelpfulVotes(prev => ({
      ...prev,
      [faqId]: isHelpful ? 'helpful' : 'not-helpful'
    }));
    
    announce(isHelpful ? 'Marked as helpful' : 'Marked as not helpful');
  }, [announce]);

  // Popular FAQs
  const popularFAQs = useMemo(() => 
    mockFAQItems
      .filter(faq => faq.isPopular)
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, 5),
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">
            Find quick answers to common questions
          </p>
        </div>
        
        <Badge variant="secondary" className="flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          {filteredFAQs.length} questions
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search FAQs..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search frequently asked questions"
                aria-describedby="faq-search-help"
              />
              <div id="faq-search-help" className="sr-only">
                Search through questions, answers, and tags
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {mockFAQCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Filter */}
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

          {/* Active Filters */}
          {(localSearchQuery || selectedCategory) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {localSearchQuery && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  Search: "{localSearchQuery}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setLocalSearchQuery('')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {selectedCategory && selectedCategory !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Category: {mockFAQCategories.find(c => c.id === selectedCategory)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setSelectedCategory('')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All FAQs ({filteredFAQs.length})</TabsTrigger>
          <TabsTrigger value="popular">Popular ({popularFAQs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <FAQList 
            faqs={filteredFAQs}
            expandedItems={expandedItems}
            helpfulVotes={helpfulVotes}
            onItemToggle={handleItemToggle}
            onHelpfulVote={handleHelpfulVote}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="popular">
          <FAQList 
            faqs={popularFAQs}
            expandedItems={expandedItems}
            helpfulVotes={helpfulVotes}
            onItemToggle={handleItemToggle}
            onHelpfulVote={handleHelpfulVote}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* No Results */}
      {filteredFAQs.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No FAQs found
            </h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any FAQs matching your search criteria.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => {
                  setLocalSearchQuery('');
                  setSelectedCategory('');
                }}
              >
                Clear Filters
              </Button>
              <Button>
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// FAQ List Component
interface FAQListProps {
  faqs: FAQItem[];
  expandedItems: string[];
  helpfulVotes: Record<string, 'helpful' | 'not-helpful' | null>;
  onItemToggle: (itemId: string) => void;
  onHelpfulVote: (faqId: string, isHelpful: boolean) => void;
  isLoading: boolean;
}

const FAQList: React.FC<FAQListProps> = ({
  faqs,
  expandedItems,
  helpfulVotes,
  onItemToggle,
  onHelpfulVote,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-6" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Accordion type="multiple" value={expandedItems} className="space-y-4">
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id} className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger 
              className="hover:no-underline p-0"
              onClick={() => onItemToggle(faq.id)}
            >
              <CardHeader className="w-full p-6 pb-4">
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 text-left">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <Badge variant="outline" className="text-xs">
                        {faq.category?.icon} {faq.category?.name}
                      </Badge>
                      {faq.isPopular && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {faq.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {faq.helpfulCount}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {expandedItems.includes(faq.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </AccordionTrigger>
            
            <AccordionContent className="pb-0">
              <CardContent className="px-6 pb-6">
                <div className="prose prose-sm max-w-none mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>

                {/* Tags */}
                {faq.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {faq.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Helpful Voting */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Was this helpful?</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={helpfulVotes[faq.id] === 'helpful' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onHelpfulVote(faq.id, true)}
                        className="flex items-center gap-1"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        Yes ({faq.helpfulCount})
                      </Button>
                      <Button
                        variant={helpfulVotes[faq.id] === 'not-helpful' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onHelpfulVote(faq.id, false)}
                        className="flex items-center gap-1"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        No ({faq.notHelpfulCount})
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Updated {new Date(faq.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default FAQSection;
