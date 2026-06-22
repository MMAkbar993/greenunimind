import React, { useState, useMemo, useCallback } from 'react';
import {
  Video,
  Play,
  Clock,
  Eye,
  Star,
  BookOpen,
  Search,
  Filter,
  Grid,
  List,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Settings,
  Download,
  Share,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  User,
  Calendar,
  Tag,
  TrendingUp,
  Award,
  CheckCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Import types
import type {
  VideoTutorial,
  VideoTutorialCategory,
  VideoProgress
} from '@/types/help-support';

interface VideoTutorialsProps {
  searchQuery?: string;
  categoryFilter?: string;
  onVideoSelect?: (video: VideoTutorial) => void;
}

// Mock data - would come from API
const mockCategories: VideoTutorialCategory[] = [
  {
    id: '1',
    name: 'Getting Started',
    description: 'Essential tutorials for new users',
    icon: '🚀',
    order: 1,
    isActive: true,
    videoCount: 8
  },
  {
    id: '2',
    name: 'Course Creation',
    description: 'Learn to create engaging courses',
    icon: '📚',
    order: 2,
    isActive: true,
    videoCount: 15
  },
  {
    id: '3',
    name: 'Video Production',
    description: 'Professional video creation tips',
    icon: '🎬',
    order: 3,
    isActive: true,
    videoCount: 12
  },
  {
    id: '4',
    name: 'Student Engagement',
    description: 'Strategies to engage your students',
    icon: '👥',
    order: 4,
    isActive: true,
    videoCount: 10
  },
  {
    id: '5',
    name: 'Analytics & Growth',
    description: 'Understanding your performance',
    icon: '📊',
    order: 5,
    isActive: true,
    videoCount: 7
  }
];

const mockVideos: VideoTutorial[] = [
  {
    id: '1',
    title: 'Getting Started: Creating Your First Course',
    description: 'Learn how to create and publish your first course on our platform. This comprehensive tutorial covers everything from initial setup to publishing your course.',
    videoUrl: 'https://example.com/video1.mp4',
    thumbnailUrl: '/api/placeholder/320/180',
    duration: 480, // 8 minutes
    categoryId: '1',
    category: mockCategories[0],
    tags: ['getting started', 'course creation', 'beginner'],
    difficulty: 'beginner',
    isPublished: true,
    isFeatured: true,
    views: 12500,
    likes: 1250,
    dislikes: 25,
    chapters: [
      { id: '1', title: 'Introduction', startTime: 0, endTime: 60 },
      { id: '2', title: 'Setting up your course', startTime: 60, endTime: 180 },
      { id: '3', title: 'Adding content', startTime: 180, endTime: 360 },
      { id: '4', title: 'Publishing', startTime: 360, endTime: 480 }
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    publishedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Advanced Video Editing Techniques',
    description: 'Master advanced video editing features to create professional content that engages your students.',
    videoUrl: 'https://example.com/video2.mp4',
    thumbnailUrl: '/api/placeholder/320/180',
    duration: 720, // 12 minutes
    categoryId: '3',
    category: mockCategories[2],
    tags: ['video editing', 'advanced', 'production'],
    difficulty: 'advanced',
    isPublished: true,
    isFeatured: false,
    views: 8900,
    likes: 890,
    dislikes: 45,
    chapters: [
      { id: '1', title: 'Advanced editing tools', startTime: 0, endTime: 240 },
      { id: '2', title: 'Color correction', startTime: 240, endTime: 480 },
      { id: '3', title: 'Audio enhancement', startTime: 480, endTime: 720 }
    ],
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z',
    publishedAt: '2024-01-05T14:00:00Z'
  },
  {
    id: '3',
    title: 'Understanding Course Analytics',
    description: 'Deep dive into course analytics and how to interpret your data to improve student engagement.',
    videoUrl: 'https://example.com/video3.mp4',
    thumbnailUrl: '/api/placeholder/320/180',
    duration: 600, // 10 minutes
    categoryId: '5',
    category: mockCategories[4],
    tags: ['analytics', 'data', 'performance'],
    difficulty: 'intermediate',
    isPublished: true,
    isFeatured: true,
    views: 6700,
    likes: 670,
    dislikes: 15,
    chapters: [
      { id: '1', title: 'Analytics overview', startTime: 0, endTime: 180 },
      { id: '2', title: 'Key metrics', startTime: 180, endTime: 420 },
      { id: '3', title: 'Actionable insights', startTime: 420, endTime: 600 }
    ],
    createdAt: '2024-01-10T16:00:00Z',
    updatedAt: '2024-01-25T16:00:00Z',
    publishedAt: '2024-01-10T16:00:00Z'
  },
  {
    id: '4',
    title: 'Student Engagement Strategies',
    description: 'Learn proven strategies to keep your students engaged and motivated throughout your course.',
    videoUrl: 'https://example.com/video4.mp4',
    thumbnailUrl: '/api/placeholder/320/180',
    duration: 540, // 9 minutes
    categoryId: '4',
    category: mockCategories[3],
    tags: ['engagement', 'students', 'motivation'],
    difficulty: 'intermediate',
    isPublished: true,
    isFeatured: false,
    views: 5400,
    likes: 540,
    dislikes: 12,
    chapters: [
      { id: '1', title: 'Understanding engagement', startTime: 0, endTime: 180 },
      { id: '2', title: 'Interactive elements', startTime: 180, endTime: 360 },
      { id: '3', title: 'Community building', startTime: 360, endTime: 540 }
    ],
    createdAt: '2024-01-12T12:00:00Z',
    updatedAt: '2024-01-27T12:00:00Z',
    publishedAt: '2024-01-12T12:00:00Z'
  }
];

const VideoTutorials: React.FC<VideoTutorialsProps> = ({
  searchQuery = '',
  categoryFilter = '',
  onVideoSelect
}) => {
  // State management
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'popularity' | 'recent' | 'duration'>('relevance');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Filter and search videos
  const filteredVideos = useMemo(() => {
    let filtered = [...mockVideos];

    // Apply search filter
    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(video => video.categoryId === selectedCategory);
    }

    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(video => video.difficulty === difficultyFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => (b.views + b.likes) - (a.views + a.likes));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
        break;
      case 'duration':
        filtered.sort((a, b) => a.duration - b.duration);
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
            return (b.views + b.likes) - (a.views + a.likes);
          });
        }
        break;
    }

    return filtered;
  }, [localSearchQuery, selectedCategory, difficultyFilter, sortBy]);

  // Calculate relevance score
  const calculateRelevanceScore = (video: VideoTutorial, query: string): number => {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    if (video.title.toLowerCase().includes(lowerQuery)) score += 10;
    if (video.description.toLowerCase().includes(lowerQuery)) score += 5;

    video.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) score += 3;
    });

    score += Math.log(video.views + 1) * 0.1;
    return score;
  };

  // Handle video selection
  const handleVideoSelect = useCallback((video: VideoTutorial) => {
    setSelectedVideo(video);
    onVideoSelect?.(video);
  }, [onVideoSelect]);

  // Utility functions
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // If a video is selected, show video player view
  if (selectedVideo) {
    return (
      <VideoPlayerView
        video={selectedVideo}
        onBack={() => setSelectedVideo(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Video Tutorials
          </h2>
          <p className="text-gray-600">
            Watch step-by-step video guides to master our platform
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
                placeholder="Search video tutorials..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search video tutorials"
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

            <Select value={difficultyFilter} onValueChange={(value: any) => setDifficultyFilter(value)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">🟢 Beginner</SelectItem>
                <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                <SelectItem value="advanced">🔴 Advanced</SelectItem>
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
                <SelectItem value="duration">Duration</SelectItem>
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
                    {category.videoCount} videos
                  </Badge>
                  <Video className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Videos List */}
      {(localSearchQuery || selectedCategory) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoSelect(video)}
                  formatDuration={formatDuration}
                  getDifficultyColor={getDifficultyColor}
                  formatViews={formatViews}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <VideoListItem
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoSelect(video)}
                  formatDuration={formatDuration}
                  getDifficultyColor={getDifficultyColor}
                  formatViews={formatViews}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Featured Videos */}
      {!localSearchQuery && !selectedCategory && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Featured Tutorials</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockVideos
              .filter(video => video.isFeatured)
              .map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoSelect(video)}
                  formatDuration={formatDuration}
                  getDifficultyColor={getDifficultyColor}
                  formatViews={formatViews}
                />
              ))}
          </div>
        </div>
      )}

      {/* All Videos */}
      {!localSearchQuery && !selectedCategory && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">All Tutorials</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => handleVideoSelect(video)}
                formatDuration={formatDuration}
                getDifficultyColor={getDifficultyColor}
                formatViews={formatViews}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredVideos.length === 0 && (localSearchQuery || selectedCategory) && (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No video tutorials found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or filters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setLocalSearchQuery('');
                  setSelectedCategory('');
                  setDifficultyFilter('all');
                }}
              >
                Clear Filters
              </Button>
              <Button variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Knowledge Base Instead
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Video Card Component
interface VideoCardProps {
  video: VideoTutorial;
  onClick: () => void;
  formatDuration: (seconds: number) => string;
  getDifficultyColor: (difficulty: string) => string;
  formatViews: (views: number) => string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onClick,
  formatDuration,
  getDifficultyColor,
  formatViews
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="relative">
        <div className="aspect-video bg-gray-200 flex items-center justify-center">
          <Play className="w-12 h-12 text-gray-400" />
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
        {video.isFeatured && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {video.category?.icon} {video.category?.name}
          </Badge>
          <Badge className={`text-xs ${getDifficultyColor(video.difficulty)}`}>
            {video.difficulty}
          </Badge>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {video.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {video.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatViews(video.views)} views
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {formatViews(video.likes)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Video List Item Component
interface VideoListItemProps {
  video: VideoTutorial;
  onClick: () => void;
  formatDuration: (seconds: number) => string;
  getDifficultyColor: (difficulty: string) => string;
  formatViews: (views: number) => string;
}

const VideoListItem: React.FC<VideoListItemProps> = ({
  video,
  onClick,
  formatDuration,
  getDifficultyColor,
  formatViews
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-32 h-20 bg-gray-200 rounded flex items-center justify-center">
              <Play className="w-6 h-6 text-gray-400" />
            </div>
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
              {formatDuration(video.duration)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {video.category?.icon} {video.category?.name}
              </Badge>
              <Badge className={`text-xs ${getDifficultyColor(video.difficulty)}`}>
                {video.difficulty}
              </Badge>
              {video.isFeatured && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">
              {video.title}
            </h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {video.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatViews(video.views)} views
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {formatViews(video.likes)} likes
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(video.publishedAt || video.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Video Player View Component
interface VideoPlayerViewProps {
  video: VideoTutorial;
  onBack: () => void;
}

const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({ video, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const progress = (currentTime / video.duration) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Videos
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Badge variant="outline" className="text-xs">
              {video.category?.icon} {video.category?.name}
            </Badge>
            <span>•</span>
            <span>{Math.floor(video.duration / 60)} minutes</span>
            <span>•</span>
            <span>{video.views.toLocaleString()} views</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              {/* Video Container */}
              <div className="relative bg-black aspect-video rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12" />}
                  </Button>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <Progress value={progress} className="h-1" />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>

                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                        <SkipBack className="w-4 h-4" />
                      </Button>

                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                        <SkipForward className="w-4 h-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          onValueChange={(value) => setVolume(value[0])}
                          max={100}
                          step={1}
                          className="w-20"
                        />
                      </div>

                      <span className="text-sm">
                        {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                        <Settings className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                      >
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Description */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{video.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {video.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(video.publishedAt || video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {video.likes}
                  </Button>
                  <Button variant="outline" size="sm">
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    {video.dislikes}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">
                {video.description}
              </p>

              {video.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {video.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Video Chapters */}
          {video.chapters && video.chapters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {video.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => setCurrentTime(chapter.startTime)}
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <Play className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chapter.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.floor(chapter.startTime / 60)}:{(chapter.startTime % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Videos */}
          <Card>
            <CardHeader>
              <CardTitle>Related Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockVideos
                  .filter(v => v.id !== video.id && v.categoryId === video.categoryId)
                  .slice(0, 3)
                  .map((relatedVideo) => (
                    <div
                      key={relatedVideo.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedVideo(relatedVideo);
                        setCurrentTime(0);
                        setIsPlaying(false);
                      }}
                    >
                      <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <Play className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {relatedVideo.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.floor(relatedVideo.duration / 60)} min • {relatedVideo.views.toLocaleString()} views
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoTutorials;
