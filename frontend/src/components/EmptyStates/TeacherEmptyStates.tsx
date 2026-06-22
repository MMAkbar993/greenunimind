import React from 'react';
import {
  BookOpen,
  MessageSquare,
  Star,
  BarChart3,
  Plus,
  Users,
  DollarSign,
  Target,
  ArrowRight,
  Lightbulb,
  Rocket,
  Heart,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  className?: string;
}

// Dashboard Welcome Empty State
export const DashboardWelcomeState: React.FC<EmptyStateProps> = ({ className }) => (
  <Card className={`border-0 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
    <CardContent className="p-8 text-center">
      <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <Rocket className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Welcome to Your Teaching Journey! 🎉
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        You're all set to start creating amazing courses and sharing your knowledge with students worldwide. 
        Let's get you started with your first course!
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link to="/teacher/courses/create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Course
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/teacher/help" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Getting Started Guide
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <BookOpen className="w-4 h-4 text-blue-500" />
          <span>Create courses</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-4 h-4 text-green-500" />
          <span>Engage students</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="w-4 h-4 text-purple-500" />
          <span>Earn revenue</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Analytics Empty State with Sample Data Visualization
export const AnalyticsEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Welcome Message */}
    <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardContent className="p-6 text-center">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <BarChart3 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Analytics Dashboard Preview 📊
        </h3>
        <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">
          Here's what your analytics will look like once you start teaching. Create your first course to see real data!
        </p>

        <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
          <Link to="/teacher/courses/create" className="flex items-center gap-2">
            <Plus className="w-3 h-3" />
            Create Your First Course
          </Link>
        </Button>
      </CardContent>
    </Card>

    {/* Sample Analytics Cards */}
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {/* Sample stat cards with placeholder data */}
      <Card className="dashboard-stat-card opacity-60">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="dashboard-stat-icon bg-indigo-50 text-indigo-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-xs sm:text-sm text-gray-400">+0%</span>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h3 className="dashboard-stat-label text-xs sm:text-sm">Total Courses</h3>
            <p className="dashboard-stat-value text-xl sm:text-2xl">0</p>
            <p className="dashboard-stat-change text-xs">Start by creating your first course</p>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-stat-card opacity-60">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="dashboard-stat-icon bg-green-50 text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-xs sm:text-sm text-gray-400">+0%</span>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h3 className="dashboard-stat-label text-xs sm:text-sm">Total Students</h3>
            <p className="dashboard-stat-value text-xl sm:text-2xl">0</p>
            <p className="dashboard-stat-change text-xs">Students will enroll in your courses</p>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-stat-card opacity-60">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="dashboard-stat-icon bg-yellow-50 text-yellow-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-xs sm:text-sm text-gray-400">+0%</span>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h3 className="dashboard-stat-label text-xs sm:text-sm">Total Earnings</h3>
            <p className="dashboard-stat-value text-xl sm:text-2xl">$0</p>
            <p className="dashboard-stat-change text-xs">Earnings from course sales</p>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-stat-card opacity-60">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="dashboard-stat-icon bg-purple-50 text-purple-600">
              <Star className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-xs sm:text-sm text-gray-400">+0%</span>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h3 className="dashboard-stat-label text-xs sm:text-sm">Course Rating</h3>
            <p className="dashboard-stat-value text-xl sm:text-2xl">0.0/5</p>
            <p className="dashboard-stat-change text-xs">Based on student reviews</p>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-stat-card opacity-60">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="dashboard-stat-icon bg-indigo-50 text-indigo-600">
              <Target className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-xs sm:text-sm text-gray-400">+0%</span>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h3 className="dashboard-stat-label text-xs sm:text-sm">Completion Rate</h3>
            <p className="dashboard-stat-value text-xl sm:text-2xl">0%</p>
            <p className="dashboard-stat-change text-xs">Average across all courses</p>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-stat-card opacity-60">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="dashboard-stat-icon bg-emerald-50 text-emerald-600">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-xs sm:text-sm text-gray-400">+0%</span>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h3 className="dashboard-stat-label text-xs sm:text-sm">Performance</h3>
            <p className="dashboard-stat-value text-xl sm:text-2xl">New</p>
            <p className="dashboard-stat-change text-xs">Based on student feedback</p>
          </div>
        </CardContent>
      </Card>
    </div>


  </div>
);

// Messages Empty State
export const MessagesEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <Card className={`border-0 bg-gradient-to-br from-green-50 to-emerald-50 ${className}`}>
    <CardContent className="p-8 text-center">
      <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
        <MessageSquare className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        No Messages Yet 💬
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Once students enroll in your courses, they'll be able to message you with questions. 
        You'll see all conversations here and can respond directly.
      </p>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-left">
            <p className="text-sm font-medium text-green-800 mb-1">Pro Tip</p>
            <p className="text-sm text-green-700">
              Responding quickly to student messages improves your course ratings and builds stronger relationships!
            </p>
          </div>
        </div>
      </div>

      <Button asChild variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
        <Link to="/teacher/courses" className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          View Your Courses
        </Link>
      </Button>
    </CardContent>
  </Card>
);

// Reviews Empty State
export const ReviewsEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <Card className={`border-0 bg-gradient-to-br from-yellow-50 to-orange-50 ${className}`}>
    <CardContent className="p-8 text-center">
      <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
        <Star className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        No Reviews Yet ⭐
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Student reviews will appear here once they complete your courses. 
        Great reviews help attract more students and build your reputation as an instructor.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <Heart className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
          <p className="font-medium text-yellow-800">Quality Content</p>
          <p className="text-yellow-700">Create engaging, valuable courses</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <Users className="w-5 h-5 text-orange-600 mx-auto mb-2" />
          <p className="font-medium text-orange-800">Student Support</p>
          <p className="text-orange-700">Respond to questions promptly</p>
        </div>
      </div>

      <Button asChild className="bg-yellow-600 hover:bg-yellow-700">
        <Link to="/teacher/courses/create" className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          Start Creating Quality Content
        </Link>
      </Button>
    </CardContent>
  </Card>
);

// Recent Activity Empty State
export const RecentActivityEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <Card className={`border-0 bg-gradient-to-br from-orange-50 to-amber-50 ${className}`}>
    <CardContent className="p-6 text-center">
      <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white">
        <Clock className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Your Activity Feed Awaits! ⚡
      </h3>
      <p className="text-gray-600 mb-4 text-sm max-w-sm mx-auto">
        Once students start enrolling in your courses and engaging with your content,
        you'll see all their activities here in real-time.
      </p>

      <div className="space-y-2 mb-4">
        <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
          <Users className="w-3 h-3 mr-1" />
          Student enrollments
        </Badge>
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
          <MessageSquare className="w-3 h-3 mr-1" />
          Course interactions
        </Badge>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
          <Star className="w-3 h-3 mr-1" />
          Reviews & ratings
        </Badge>
      </div>

      <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
        <Link to="/teacher/courses/create" className="flex items-center gap-2">
          <Plus className="w-3 h-3" />
          Create Course to See Activity
        </Link>
      </Button>
    </CardContent>
  </Card>
);

// Courses Empty State
export const CoursesEmptyState: React.FC<EmptyStateProps> = ({ className }) => (
  <Card className={`border-0 bg-gradient-to-br from-indigo-50 to-blue-50 ${className}`}>
    <CardContent className="p-8 text-center">
      <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
        <BookOpen className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        Ready to Create Your First Course? 📚
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Share your expertise with students around the world. Our course creation tools make it easy to 
        build engaging, professional courses that students love.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link to="/teacher/courses/create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Course
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/teacher/help" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Course Creation Tips
          </Link>
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        💡 Tip: Start with a topic you're passionate about - your enthusiasm will shine through!
      </p>
    </CardContent>
  </Card>
);
