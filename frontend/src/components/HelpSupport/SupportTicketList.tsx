import React, { useState, useMemo, useCallback } from 'react';
import {
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  User,
  Tag,
  ArrowUpDown,
  RefreshCw,
  Download,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Paperclip
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Import types
import type {
  SupportTicketListProps,
  SupportTicket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketFilters,
  TicketMessage
} from '@/types/help-support';

// Mock data - would come from API
const mockTickets: SupportTicket[] = [
  {
    id: '1',
    ticketNumber: 'TICKET-001',
    subject: 'Unable to upload video files',
    description: 'I am experiencing issues when trying to upload video files to my course. The upload process starts but fails after a few seconds.',
    category: 'technical',
    priority: 'high',
    status: 'open',
    submittedBy: {
      _id: 'user1',
      name: { firstName: 'John', lastName: 'Doe' },
      email: 'john.doe@example.com',
      role: 'teacher'
    },
    assignedTo: {
      _id: 'agent1',
      name: { firstName: 'Sarah', lastName: 'Support' },
      email: 'sarah@support.com',
      role: 'admin'
    },
    messages: [
      {
        id: 'msg1',
        content: 'Thank you for contacting support. We are looking into your video upload issue.',
        author: {
          _id: 'agent1',
          name: { firstName: 'Sarah', lastName: 'Support' },
          email: 'sarah@support.com',
          role: 'admin'
        },
        isInternal: false,
        attachments: [],
        createdAt: '2024-01-15T10:45:00Z',
        updatedAt: '2024-01-15T10:45:00Z'
      }
    ],
    attachments: [],
    tags: ['video', 'upload', 'technical'],
    estimatedResolutionTime: '4 hours',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    lastActivity: '2024-01-15T14:20:00Z'
  },
  {
    id: '2',
    ticketNumber: 'TICKET-002',
    subject: 'Payment processing issue',
    description: 'Students are reporting that they cannot complete payments for my courses. The payment page shows an error.',
    category: 'billing',
    priority: 'medium',
    status: 'in-progress',
    submittedBy: {
      _id: 'user1',
      name: { firstName: 'John', lastName: 'Doe' },
      email: 'john.doe@example.com',
      role: 'teacher'
    },
    assignedTo: {
      _id: 'agent2',
      name: { firstName: 'Mike', lastName: 'Billing' },
      email: 'mike@support.com',
      role: 'admin'
    },
    messages: [
      {
        id: 'msg2',
        content: 'We have identified the issue and are working on a fix. Expected resolution within 24 hours.',
        author: {
          _id: 'agent2',
          name: { firstName: 'Mike', lastName: 'Billing' },
          email: 'mike@support.com',
          role: 'admin'
        },
        isInternal: false,
        attachments: [],
        createdAt: '2024-01-14T15:30:00Z',
        updatedAt: '2024-01-14T15:30:00Z'
      }
    ],
    attachments: [],
    tags: ['payment', 'billing', 'urgent'],
    estimatedResolutionTime: '24 hours',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-15T11:45:00Z',
    lastActivity: '2024-01-15T11:45:00Z'
  },
  {
    id: '3',
    ticketNumber: 'TICKET-003',
    subject: 'Course analytics not updating',
    description: 'The analytics dashboard for my courses is not showing updated data. The last update was 3 days ago.',
    category: 'technical',
    priority: 'low',
    status: 'resolved',
    submittedBy: {
      _id: 'user1',
      name: { firstName: 'John', lastName: 'Doe' },
      email: 'john.doe@example.com',
      role: 'teacher'
    },
    assignedTo: {
      _id: 'agent1',
      name: { firstName: 'Sarah', lastName: 'Support' },
      email: 'sarah@support.com',
      role: 'admin'
    },
    messages: [
      {
        id: 'msg3',
        content: 'The analytics system has been updated and should now show current data. Please refresh your dashboard.',
        author: {
          _id: 'agent1',
          name: { firstName: 'Sarah', lastName: 'Support' },
          email: 'sarah@support.com',
          role: 'admin'
        },
        isInternal: false,
        attachments: [],
        createdAt: '2024-01-13T10:30:00Z',
        updatedAt: '2024-01-13T10:30:00Z'
      }
    ],
    attachments: [],
    tags: ['analytics', 'dashboard', 'resolved'],
    estimatedResolutionTime: '2 hours',
    actualResolutionTime: '1.5 hours',
    satisfactionRating: 5,
    satisfactionFeedback: 'Great support, issue resolved quickly!',
    createdAt: '2024-01-12T16:20:00Z',
    updatedAt: '2024-01-13T10:30:00Z',
    resolvedAt: '2024-01-13T10:30:00Z',
    lastActivity: '2024-01-13T10:30:00Z'
  }
];

const SupportTicketList: React.FC<SupportTicketListProps> = ({
  filters = {},
  onTicketSelect,
  onFiltersChange
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'priority' | 'status'>('recent');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter and search tickets
  const filteredTickets = useMemo(() => {
    let filtered = [...mockTickets];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === selectedStatus);
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === selectedPriority);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
        break;
      case 'status':
        const statusOrder = { open: 4, 'in-progress': 3, 'waiting-response': 2, resolved: 1, closed: 0 };
        filtered.sort((a, b) => (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0));
        break;
      default: // recent
        filtered.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        break;
    }

    return filtered;
  }, [searchQuery, selectedStatus, selectedPriority, selectedCategory, sortBy]);

  // Handle ticket selection
  const handleTicketSelect = useCallback((ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    onTicketSelect?.(ticket);
  }, [onTicketSelect]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Utility functions
  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'waiting-response': return <MessageCircle className="w-4 h-4 text-orange-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'waiting-response': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case 'technical': return <AlertCircle className="w-4 h-4" />;
      case 'billing': return <Tag className="w-4 h-4" />;
      case 'course-content': return <FileText className="w-4 h-4" />;
      case 'account': return <User className="w-4 h-4" />;
      case 'feature-request': return <Plus className="w-4 h-4" />;
      case 'bug-report': return <AlertCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTicketStats = () => {
    const total = mockTickets.length;
    const open = mockTickets.filter(t => t.status === 'open').length;
    const inProgress = mockTickets.filter(t => t.status === 'in-progress').length;
    const resolved = mockTickets.filter(t => t.status === 'resolved').length;
    const closed = mockTickets.filter(t => t.status === 'closed').length;

    return { total, open, inProgress, resolved, closed };
  };

  const stats = getTicketStats();

  // If a ticket is selected, show ticket detail view
  if (selectedTicket) {
    return (
      <TicketDetailView
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            My Support Tickets
          </h2>
          <p className="text-gray-600">
            Track and manage your support requests
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <Button className="bg-brand-primary hover:bg-brand-primary-dark">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-600">{stats.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search support tickets"
              />
            </div>

            <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="waiting-response">Waiting Response</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={(value: any) => setSelectedPriority(value)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleTicketSelect(ticket)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(ticket.status)}
                    <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                    {ticket.assignedTo && (
                      <Badge variant="outline" className="text-xs">
                        Assigned to {ticket.assignedTo.name.firstName}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {ticket.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      #{ticket.ticketNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      {getCategoryIcon(ticket.category)}
                      {ticket.category.replace('-', ' ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ticket.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last activity {formatDate(ticket.lastActivity)}
                    </span>
                    {ticket.attachments.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        {ticket.attachments.length} attachment{ticket.attachments.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('-', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                      {ticket.priority} priority
                    </Badge>
                    {ticket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {ticket.estimatedResolutionTime && (
                    <div className="mt-2 text-xs text-gray-500">
                      Estimated resolution: {ticket.estimatedResolutionTime}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {ticket.messages.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                    </Badge>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleTicketSelect(ticket)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Ticket
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTickets.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedCategory !== 'all'
                ? 'No tickets found'
                : 'No support tickets yet'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'When you submit support requests, they\'ll appear here.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {(searchQuery || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedCategory !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('all');
                    setSelectedPriority('all');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Ticket Detail View Component
interface TicketDetailViewProps {
  ticket: SupportTicket;
  onBack: () => void;
}

const TicketDetailView: React.FC<TicketDetailViewProps> = ({ ticket, onBack }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNewMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'waiting-response': return <MessageCircle className="w-4 h-4 text-orange-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'waiting-response': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Back to Tickets
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-gray-600">#{ticket.ticketNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(ticket.status)}>
            {getStatusIcon(ticket.status)}
            <span className="ml-1">{ticket.status.replace('-', ' ')}</span>
          </Badge>
          <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
            {ticket.priority} priority
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <p className="mt-1 text-gray-900">{ticket.description}</p>
              </div>

              {ticket.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tags</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {ticket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {message.author.name.firstName[0]}{message.author.name.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.author.name.firstName} {message.author.name.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {message.author.role}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-900">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Reply Form */}
              <div className="space-y-4">
                <Label htmlFor="reply">Add a reply</Label>
                <Textarea
                  id="reply"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <div className="mt-1">
                  <Badge className={getStatusColor(ticket.status)}>
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1">{ticket.status.replace('-', ' ')}</span>
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Priority</Label>
                <div className="mt-1">
                  <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Category</Label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {ticket.category.replace('-', ' ')}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Created</Label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(ticket.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {ticket.estimatedResolutionTime && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Estimated Resolution</Label>
                  <p className="mt-1 text-sm text-gray-900">{ticket.estimatedResolutionTime}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Agent */}
          {ticket.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {ticket.assignedTo.name.firstName[0]}{ticket.assignedTo.name.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {ticket.assignedTo.name.firstName} {ticket.assignedTo.name.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{ticket.assignedTo.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Ticket
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="w-4 h-4 mr-2" />
                Edit Ticket
              </Button>
              {ticket.status !== 'closed' && (
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Close Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketList;
