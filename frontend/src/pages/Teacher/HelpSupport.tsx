import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  MessageSquare,
  BookOpen,
  Video,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Star,
  Phone,
  Mail,
  MessageCircle,
  Headphones
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Import Help & Support components (to be created)
import FAQSection from '@/components/HelpSupport/FAQSection';
import ContactSupportForm from '@/components/HelpSupport/ContactSupportForm';
import KnowledgeBaseBrowser from '@/components/HelpSupport/KnowledgeBaseBrowser';
import SupportTicketList from '@/components/HelpSupport/SupportTicketList';
import VideoTutorials from '@/components/HelpSupport/VideoTutorials';
import DownloadCenter from '@/components/HelpSupport/DownloadCenter';
import LiveChatWidget from '@/components/HelpSupport/LiveChatWidget';

// Import types
import type { HelpSupportPageProps, ContactFormData } from '@/types/help-support';

// Import hooks
import { useGetMeQuery } from '@/redux/features/auth/authApi';

const HelpSupport: React.FC<HelpSupportPageProps> = ({ 
  initialTab = 'overview',
  searchQuery: initialSearchQuery = ''
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: userData } = useGetMeQuery(undefined);
  
  // State management
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialSearchQuery);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simple announce function for accessibility
  const announce = useCallback((message: string) => {
    // Simple implementation - could be enhanced with screen reader announcements
    console.log('Accessibility announcement:', message);
  }, []);

  // Debounced search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // URL synchronization
  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    const query = searchParams.get('search') || '';
    
    setActiveTab(tab);
    setSearchQuery(query);
  }, [searchParams]);

  // Update URL when tab or search changes
  const updateURL = useCallback((newTab: string, newSearch?: string) => {
    const params = new URLSearchParams();
    params.set('tab', newTab);
    if (newSearch) {
      params.set('search', newSearch);
    }
    setSearchParams(params);
  }, [setSearchParams]);

  // Tab change handler
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    updateURL(newTab, searchQuery);
    announce(`Switched to ${newTab} section`);
  }, [updateURL, searchQuery, announce]);

  // Search change handler
  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
    updateURL(activeTab, newQuery);
  }, [updateURL, activeTab]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Trigger refresh of all data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      announce('Help & Support data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      announce('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [announce]);

  // Support statistics (mock data - would come from API)
  const supportStats = useMemo(() => ({
    totalTickets: 156,
    openTickets: 23,
    resolvedTickets: 133,
    averageResponseTime: '2.5 hours',
    satisfactionScore: 4.8,
    popularTopics: ['Course Creation', 'Payment Issues', 'Technical Support'],
    onlineAgents: 5
  }), []);

  // Tab configuration
  const tabs = useMemo(() => [
    {
      id: 'overview',
      label: 'Overview',
      icon: <HelpCircle className="w-4 h-4" />,
      description: 'Get started and find quick answers'
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: <HelpCircle className="w-4 h-4" />,
      description: 'Frequently asked questions'
    },
    {
      id: 'contact',
      label: 'Contact Support',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Get help from our support team'
    },
    {
      id: 'knowledge-base',
      label: 'Knowledge Base',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Browse our documentation'
    },
    {
      id: 'tickets',
      label: 'My Tickets',
      icon: <MessageCircle className="w-4 h-4" />,
      description: 'View your support tickets'
    },
    {
      id: 'tutorials',
      label: 'Video Tutorials',
      icon: <Video className="w-4 h-4" />,
      description: 'Watch helpful video guides'
    },
    {
      id: 'downloads',
      label: 'Downloads',
      icon: <Download className="w-4 h-4" />,
      description: 'User guides and resources'
    }
  ], []);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Help & Support 🆘
            </h1>
            <p className="text-gray-600 text-lg">
              Get the help you need to succeed on our platform
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
              aria-label="Refresh help and support data"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            
            <Button 
              className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => handleTabChange('contact')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>

        {/* Support Status Banner */}
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <p className="font-medium text-green-800">
                    Support is online
                  </p>
                  <p className="text-sm text-green-600">
                    {supportStats.onlineAgents} agents available • Average response time: {supportStats.averageResponseTime}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Star className="w-3 h-3 mr-1" />
                {supportStats.satisfactionScore}/5.0
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Global Search */}
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search for help articles, FAQs, tutorials..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                  aria-label="Search help and support content"
                  aria-describedby="search-help"
                />
                <div id="search-help" className="sr-only">
                  Search across all help content including FAQs, articles, videos, and downloads
                </div>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
            
            {debouncedSearchQuery && (
              <div className="mt-4 text-sm text-gray-600">
                Searching for: <span className="font-medium">"{debouncedSearchQuery}"</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 text-xs sm:text-sm"
                aria-label={`${tab.label}: ${tab.description}`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewSection 
              searchQuery={debouncedSearchQuery}
              stats={supportStats}
              onTabChange={handleTabChange}
            />
          </TabsContent>

          <TabsContent value="faq">
            <FAQSection 
              searchQuery={debouncedSearchQuery}
              onSearchChange={handleSearchChange}
            />
          </TabsContent>

          <TabsContent value="contact">
            <ContactSupportForm
              onSubmit={async (data: ContactFormData) => {
                // Mock API call - replace with actual API integration
                console.log('Submitting support ticket:', data);
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Simulate success
                return Promise.resolve();
              }}
            />
          </TabsContent>

          <TabsContent value="knowledge-base">
            <KnowledgeBaseBrowser 
              searchQuery={debouncedSearchQuery}
            />
          </TabsContent>

          <TabsContent value="tickets">
            <SupportTicketList />
          </TabsContent>

          <TabsContent value="tutorials">
            <VideoTutorials 
              searchQuery={debouncedSearchQuery}
            />
          </TabsContent>

          <TabsContent value="downloads">
            <DownloadCenter 
              searchQuery={debouncedSearchQuery}
            />
          </TabsContent>
        </Tabs>

        {/* Live Chat Widget */}
        <LiveChatWidget />
      </div>
    </main>
  );
};

// Overview Section Component
interface OverviewSectionProps {
  searchQuery?: string;
  stats: any;
  onTabChange: (tab: string) => void;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({
  stats,
  onTabChange
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-stat-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="dashboard-stat-icon bg-blue-50 text-blue-600">
                <MessageCircle className="w-6 h-6" />
              </div>
              <Badge variant="secondary">{stats.openTickets} open</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="dashboard-stat-label">Support Tickets</h3>
              <p className="dashboard-stat-value">{stats.totalTickets}</p>
              <p className="dashboard-stat-change">{stats.resolvedTickets} resolved</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="dashboard-stat-icon bg-green-50 text-green-600">
                <Clock className="w-6 h-6" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Fast</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="dashboard-stat-label">Response Time</h3>
              <p className="dashboard-stat-value">{stats.averageResponseTime}</p>
              <p className="dashboard-stat-change">Average response</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="dashboard-stat-icon bg-yellow-50 text-yellow-600">
                <Star className="w-6 h-6" />
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Excellent</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="dashboard-stat-label">Satisfaction</h3>
              <p className="dashboard-stat-value">{stats.satisfactionScore}/5.0</p>
              <p className="dashboard-stat-change">Customer rating</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="dashboard-stat-icon bg-purple-50 text-purple-600">
                <Users className="w-6 h-6" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="dashboard-stat-label">Support Agents</h3>
              <p className="dashboard-stat-value">{stats.onlineAgents}</p>
              <p className="dashboard-stat-change">Available now</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-primary" />
              Get Help Quickly
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onTabChange('contact')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit a Support Ticket
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onTabChange('faq')}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Browse FAQ
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onTabChange('tutorials')}
            >
              <Video className="w-4 h-4 mr-2" />
              Watch Tutorials
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onTabChange('knowledge-base')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Search Knowledge Base
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              Popular Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.popularTopics.map((topic: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{topic}</span>
                  <Button variant="ghost" size="sm">
                    View →
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-brand-primary" />
            Contact Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium">Live Chat</p>
                <p className="text-sm text-gray-600">Available 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Mail className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-gray-600">support@lms.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Phone className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
              <Headphones className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-medium">Video Call</p>
                <p className="text-sm text-gray-600">Schedule a call</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpSupport;
