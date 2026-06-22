import React, { useState, useMemo, useCallback } from 'react';
import {
  Download,
  FileText,
  Image,
  Video,
  Archive,
  Star,
  Calendar,
  Eye,
  Search,
  Filter,
  Grid,
  List,
  SortAsc,
  SortDesc,
  CheckCircle,
  Clock,
  User,
  Tag,
  ExternalLink,
  Share,
  Bookmark,
  AlertCircle,
  Info,
  TrendingUp,
  BarChart3,
  FileCheck,
  Shield,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import types
import type {
  DownloadCenterProps,
  DownloadableFile,
  DownloadCategory,
  DownloadHistory
} from '@/types/help-support';

// Mock data - would come from API
const mockCategories: DownloadCategory[] = [
  {
    id: '1',
    name: 'User Guides',
    description: 'Step-by-step guides for using the platform',
    icon: '📖',
    order: 1,
    isActive: true,
    fileCount: 8
  },
  {
    id: '2',
    name: 'Templates',
    description: 'Ready-to-use templates for courses and content',
    icon: '📋',
    order: 2,
    isActive: true,
    fileCount: 12
  },
  {
    id: '3',
    name: 'Best Practices',
    description: 'Guidelines and best practices for success',
    icon: '⭐',
    order: 3,
    isActive: true,
    fileCount: 6
  },
  {
    id: '4',
    name: 'Technical Documentation',
    description: 'API docs and technical specifications',
    icon: '🔧',
    order: 4,
    isActive: true,
    fileCount: 15
  },
  {
    id: '5',
    name: 'Marketing Materials',
    description: 'Promotional materials and brand assets',
    icon: '📢',
    order: 5,
    isActive: true,
    fileCount: 9
  }
];

const DownloadCenter: React.FC<DownloadCenterProps> = ({
  searchQuery = '',
  categoryFilter = '',
  onDownload
}) => {
  // State management
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'downloads' | 'size'>('downloads');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFile, setSelectedFile] = useState<DownloadableFile | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const mockFiles: DownloadableFile[] = [
    {
      id: '1',
      title: 'Teacher Quick Start Guide',
      description: 'Complete guide to getting started as a teacher on our platform.',
      fileName: 'teacher-quick-start-guide.pdf',
      fileSize: 2.5 * 1024 * 1024, // 2.5 MB
      fileType: 'application/pdf',
      downloadUrl: '/downloads/teacher-quick-start-guide.pdf',
      categoryId: '1',
      category: mockCategories[0],
      tags: ['getting started', 'teacher', 'guide'],
      version: '2.1',
      isPublished: true,
      isFeatured: true,
      downloadCount: 15420,
      lastUpdated: '2024-01-15T10:30:00Z',
      createdAt: '2023-12-01T10:00:00Z',
      publishedAt: '2023-12-01T10:00:00Z',
      requirements: ['PDF reader'],
      changelog: 'Updated with new dashboard features and improved screenshots'
    },
    {
      id: '2',
      title: 'Course Creation Template',
      description: 'Template to help you structure your course content effectively.',
      fileName: 'course-creation-template.docx',
      fileSize: 1.2 * 1024 * 1024, // 1.2 MB
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      downloadUrl: '/downloads/course-creation-template.docx',
      categoryId: '2',
      category: mockCategories[1],
      tags: ['template', 'course', 'structure'],
      version: '1.5',
      isPublished: true,
      isFeatured: false,
      downloadCount: 8900,
      lastUpdated: '2024-01-10T14:20:00Z',
      createdAt: '2023-11-15T14:00:00Z',
      publishedAt: '2023-11-15T14:00:00Z',
      requirements: ['Microsoft Word or compatible editor'],
      changelog: 'Added new sections for interactive content and assessments'
    },
    {
      id: '3',
      title: 'Video Recording Best Practices',
      description: 'Guidelines and tips for recording high-quality educational videos.',
      fileName: 'video-recording-best-practices.pdf',
      fileSize: 3.8 * 1024 * 1024, // 3.8 MB
      fileType: 'application/pdf',
      downloadUrl: '/downloads/video-recording-best-practices.pdf',
      categoryId: '3',
      category: mockCategories[2],
      tags: ['video', 'recording', 'best practices'],
      version: '1.0',
      isPublished: true,
      isFeatured: true,
      downloadCount: 6750,
      lastUpdated: '2024-01-08T16:45:00Z',
      createdAt: '2023-11-20T16:00:00Z',
      publishedAt: '2023-11-20T16:00:00Z',
      requirements: ['PDF reader'],
      changelog: 'Initial release with comprehensive video production guidelines'
    },
    {
      id: '4',
      title: 'Platform API Documentation',
      description: 'Complete API documentation for developers and advanced users.',
      fileName: 'api-documentation.zip',
      fileSize: 12.5 * 1024 * 1024, // 12.5 MB
      fileType: 'application/zip',
      downloadUrl: '/downloads/api-documentation.zip',
      categoryId: '4',
      category: mockCategories[3],
      tags: ['api', 'documentation', 'developer'],
      version: '3.2',
      isPublished: true,
      isFeatured: false,
      downloadCount: 2340,
      lastUpdated: '2024-01-12T09:15:00Z',
      createdAt: '2023-10-01T09:00:00Z',
      publishedAt: '2023-10-01T09:00:00Z',
      requirements: ['ZIP extractor', 'Code editor'],
      changelog: 'Added new endpoints for course analytics and student management'
    },
    {
      id: '5',
      title: 'Brand Guidelines and Assets',
      description: 'Official brand guidelines, logos, and marketing materials.',
      fileName: 'brand-guidelines.zip',
      fileSize: 8.2 * 1024 * 1024, // 8.2 MB
      fileType: 'application/zip',
      downloadUrl: '/downloads/brand-guidelines.zip',
      categoryId: '5',
      category: mockCategories[4],
      tags: ['brand', 'marketing', 'assets'],
      version: '2.0',
      isPublished: true,
      isFeatured: true,
      downloadCount: 4560,
      lastUpdated: '2024-01-05T11:30:00Z',
      createdAt: '2023-09-15T11:00:00Z',
      publishedAt: '2023-09-15T11:00:00Z',
      requirements: ['ZIP extractor', 'Design software'],
      changelog: 'Updated brand colors and added new logo variations'
    }
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (fileType.includes('image')) return <Image className="w-6 h-6 text-blue-500" />;
    if (fileType.includes('video')) return <Video className="w-6 h-6 text-purple-500" />;
    if (fileType.includes('zip') || fileType.includes('archive')) return <Archive className="w-6 h-6 text-orange-500" />;
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'User Guides': return 'bg-blue-100 text-blue-800';
      case 'Templates': return 'bg-green-100 text-green-800';
      case 'Best Practices': return 'bg-purple-100 text-purple-800';
      case 'Technical': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (file: any) => {
    // Simulate download
    console.log('Downloading:', file.fileName);
    onDownload?.(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Download Center
        </h2>
        <p className="text-gray-600">
          Access user guides, templates, and resources to help you succeed
        </p>
      </div>

      {/* Categories */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['User Guides', 'Templates', 'Best Practices', 'Technical'].map((category) => {
          const categoryFiles = mockFiles.filter(file => file.category === category);
          return (
            <Card key={category} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                  <Badge variant="outline" className="text-xs">
                    {categoryFiles.length} files
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {categoryFiles.reduce((total, file) => total + file.downloadCount, 0).toLocaleString()} downloads
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Featured Downloads */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Featured Downloads</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {mockFiles
            .filter(file => file.isFeatured)
            .map((file) => (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.fileType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(file.category)} variant="secondary">
                          {file.category}
                        </Badge>
                        {file.isFeatured && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {file.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {file.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>v{file.version}</span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {file.downloadCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(file.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <Button 
                        onClick={() => handleDownload(file)}
                        className="w-full sm:w-auto"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* All Downloads */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">All Downloads</h3>
        <div className="space-y-3">
          {mockFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.fileType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{file.title}</h3>
                      <Badge className={getCategoryColor(file.category)} variant="outline">
                        {file.category}
                      </Badge>
                      {file.isFeatured && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {file.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{file.fileName}</span>
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>v{file.version}</span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {file.downloadCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(file.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {mockFiles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No downloads available
            </h3>
            <p className="text-gray-600 mb-6">
              We're working on creating helpful resources for you to download.
            </p>
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Browse Knowledge Base Instead
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DownloadCenter;
