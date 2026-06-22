import { motion } from 'framer-motion';
import ResponsiveCourseSlider from './ResponsiveCourseSlider';
import { ICourse } from '@/types/course';

// Mock course data for demonstration
const mockCourses: ICourse[] = [
  {
    _id: '1',
    title: 'Complete React Developer Course',
    description: 'Learn React from scratch with modern hooks, context, and best practices',
    courseLevel: 'Beginner',
    coursePrice: 49.99,
    courseThumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
    creator: {
      _id: '1',
      name: {
        firstName: 'John',
        lastName: 'Doe'
      }
    },
    lectures: [
      { _id: '1', lectureTitle: 'Introduction to React', courseId: '1', order: 1 },
      { _id: '2', lectureTitle: 'Components and JSX', courseId: '1', order: 2 },
      { _id: '3', lectureTitle: 'State and Props', courseId: '1', order: 3 }
    ],
    isPublished: true,
    status: 'published',
    category: 'Programming',
    totalEnrollment: 1250
  },
  {
    _id: '2',
    title: 'Advanced JavaScript Masterclass',
    description: 'Master advanced JavaScript concepts including closures, prototypes, and async programming',
    courseLevel: 'Advanced',
    coursePrice: 79.99,
    courseThumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop',
    creator: {
      _id: '2',
      name: {
        firstName: 'Jane',
        lastName: 'Smith'
      }
    },
    lectures: [
      { _id: '4', lectureTitle: 'Closures Deep Dive', courseId: '2', order: 1 },
      { _id: '5', lectureTitle: 'Prototypal Inheritance', courseId: '2', order: 2 },
      { _id: '6', lectureTitle: 'Async/Await Patterns', courseId: '2', order: 3 },
      { _id: '7', lectureTitle: 'Event Loop', courseId: '2', order: 4 }
    ],
    isPublished: true,
    status: 'published',
    category: 'Programming',
    totalEnrollment: 890
  },
  {
    _id: '3',
    title: 'UI/UX Design Fundamentals',
    description: 'Learn the principles of user interface and user experience design',
    courseLevel: 'Intermediate',
    coursePrice: 59.99,
    courseThumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    creator: {
      _id: '3',
      name: {
        firstName: 'Mike',
        lastName: 'Johnson'
      }
    },
    lectures: [
      { _id: '8', lectureTitle: 'Design Principles', courseId: '3', order: 1 },
      { _id: '9', lectureTitle: 'Color Theory', courseId: '3', order: 2 },
      { _id: '10', lectureTitle: 'Typography', courseId: '3', order: 3 }
    ],
    isPublished: true,
    status: 'published',
    category: 'Design',
    totalEnrollment: 650
  },
  {
    _id: '4',
    title: 'Python for Data Science',
    description: 'Complete guide to Python programming for data analysis and machine learning',
    courseLevel: 'Intermediate',
    coursePrice: 69.99,
    courseThumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=300&fit=crop',
    creator: {
      _id: '4',
      name: {
        firstName: 'Sarah',
        lastName: 'Wilson'
      }
    },
    lectures: [
      { _id: '11', lectureTitle: 'Python Basics', courseId: '4', order: 1 },
      { _id: '12', lectureTitle: 'NumPy and Pandas', courseId: '4', order: 2 },
      { _id: '13', lectureTitle: 'Data Visualization', courseId: '4', order: 3 },
      { _id: '14', lectureTitle: 'Machine Learning Intro', courseId: '4', order: 4 }
    ],
    isPublished: true,
    status: 'published',
    category: 'Data Science',
    totalEnrollment: 1100
  },
  {
    _id: '5',
    title: 'Digital Marketing Strategy',
    description: 'Learn how to create effective digital marketing campaigns',
    courseLevel: 'Beginner',
    coursePrice: 39.99,
    courseThumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    creator: {
      _id: '5',
      name: {
        firstName: 'David',
        lastName: 'Brown'
      }
    },
    lectures: [
      { _id: '15', lectureTitle: 'Marketing Fundamentals', courseId: '5', order: 1 },
      { _id: '16', lectureTitle: 'Social Media Strategy', courseId: '5', order: 2 },
      { _id: '17', lectureTitle: 'Content Marketing', courseId: '5', order: 3 }
    ],
    isPublished: true,
    status: 'published',
    category: 'Marketing',
    totalEnrollment: 750
  },
  {
    _id: '6',
    title: 'Mobile App Development with Flutter',
    description: 'Build beautiful mobile apps for iOS and Android using Flutter',
    courseLevel: 'Intermediate',
    coursePrice: 89.99,
    courseThumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop',
    creator: {
      _id: '6',
      name: {
        firstName: 'Emily',
        lastName: 'Davis'
      }
    },
    lectures: [
      { _id: '18', lectureTitle: 'Flutter Basics', courseId: '6', order: 1 },
      { _id: '19', lectureTitle: 'Widgets and Layouts', courseId: '6', order: 2 },
      { _id: '20', lectureTitle: 'State Management', courseId: '6', order: 3 },
      { _id: '21', lectureTitle: 'API Integration', courseId: '6', order: 4 }
    ],
    isPublished: true,
    status: 'published',
    category: 'Mobile Development',
    totalEnrollment: 920
  }
];

const CourseSliderDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Course Slider Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our Udemy-style responsive course slider with touch/swipe support,
            auto-scroll, and beautiful animations.
          </p>
        </motion.div>

        {/* Multiple Slider Examples */}
        <div className="space-y-16">
          {/* Popular Courses */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ResponsiveCourseSlider 
              courses={mockCourses} 
              title="🔥 Popular Courses"
              showTitle={true}
            />
          </motion.section>

          {/* Featured Courses */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <ResponsiveCourseSlider 
              courses={mockCourses.slice(0, 4)} 
              title="⭐ Featured Courses"
              showTitle={true}
            />
          </motion.section>

          {/* New Releases */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <ResponsiveCourseSlider 
              courses={mockCourses.slice(2)} 
              title="🆕 New Releases"
              showTitle={true}
            />
          </motion.section>
        </div>

        {/* Features List */}
        <motion.div
          className="mt-20 bg-white rounded-2xl shadow-lg p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Slider Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                📱
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fully Responsive</h3>
              <p className="text-gray-600 text-sm">Adapts to all screen sizes from mobile to desktop</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                👆
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Touch & Swipe</h3>
              <p className="text-gray-600 text-sm">Native touch gestures and swipe support</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                ⚡
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smooth Animations</h3>
              <p className="text-gray-600 text-sm">Fluid transitions powered by Framer Motion</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                🔄
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Auto-scroll</h3>
              <p className="text-gray-600 text-sm">Automatic progression with pause on hover</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                🎯
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Navigation Controls</h3>
              <p className="text-gray-600 text-sm">Arrow buttons, dots indicator, and progress bar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                🎨
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Udemy-style Design</h3>
              <p className="text-gray-600 text-sm">Professional course cards with hover effects</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CourseSliderDemo;
