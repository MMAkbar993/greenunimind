import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useGetPopularCoursesQuery } from '@/redux/features/course/courseApi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import CourseCard from '@/components/CourseCard';
import { ICourse } from '@/types/course';
import {
  TrendingUp,
  Sparkles,
  BookOpen,
  Users,
  Star,
  ChevronRight,
} from 'lucide-react';

const PopularCoursesSection = () => {
  const { data: popularCourses, isLoading, isError } = useGetPopularCoursesQuery(8);

  // Animation variants

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  if (isError) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-50 to-white">
        <div className="responsive-container">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <p className="text-gray-600 mb-8">
              Unable to load popular courses at the moment. Please try again later.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-600"
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-100 rounded-full opacity-20 -translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-200 rounded-full opacity-20 translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-50 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      </div>

      <div className="responsive-container relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-8 sm:mb-10 md:mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="inline-block px-4 py-2 bg-green-100 text-green-600 rounded-full text-sm font-medium mb-4">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span>Most Popular</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
            Popular <span className="text-green-500 relative">
              Sustainability Courses
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5.5C50 -0.5 150 -0.5 299 5.5" stroke="#5CBA47" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </span>
          </h2>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover the most sought-after environmental courses chosen by thousands of eco-conscious learners worldwide.
            Start your green learning journey with our top-rated sustainability content.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-8 sm:mb-10 md:mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="flex items-center bg-white rounded-xl shadow-sm px-4 sm:px-6 py-4 border border-gray-100">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-green-100 flex items-center justify-center mr-3 sm:mr-4">
              <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{popularCourses?.data?.length || 0}+</p>
              <p className="text-xs sm:text-sm text-gray-600">Eco Courses</p>
            </div>
          </div>

          <div className="flex items-center bg-white rounded-xl shadow-sm px-4 sm:px-6 py-4 border border-gray-100">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-green-100 flex items-center justify-center mr-3 sm:mr-4">
              <Users className="w-5 sm:w-6 h-5 sm:h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">50K+</p>
              <p className="text-xs sm:text-sm text-gray-600">Green Learners</p>
            </div>
          </div>

          <div className="flex items-center bg-white rounded-xl shadow-sm px-4 sm:px-6 py-4 border border-gray-100">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-green-100 flex items-center justify-center mr-3 sm:mr-4">
              <Star className="w-5 sm:w-6 h-5 sm:h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">4.8</p>
              <p className="text-xs sm:text-sm text-gray-600">Impact Rating</p>
            </div>
          </div>
        </motion.div>

        {/* Courses Carousel */}
        {isLoading ? (
          <div className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex justify-between items-center pt-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-8 w-20 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : popularCourses?.data && popularCourses.data.length > 0 ? (
          <motion.div
            className="mb-12 relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Carousel
              opts={{
                align: "start",
                loop: true,
                skipSnaps: false,
                dragFree: true,
              }}
              className="w-full max-w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {popularCourses.data.map((course: ICourse, index: number) => (
                  <CarouselItem
                    key={course._id}
                    className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 min-w-0"
                  >
                    <motion.div
                      className="h-full"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <CourseCard
                        course={course}
                        showPrice={true}
                        className="h-full"
                      />
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden lg:flex -left-12 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-green-300 text-gray-700 hover:text-green-600 shadow-lg" />
              <CarouselNext className="hidden lg:flex -right-12 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-green-300 text-gray-700 hover:text-green-600 shadow-lg" />
            </Carousel>

            {/* Mobile Navigation Hint */}
            <div className="lg:hidden text-center mt-4">
              <p className="text-sm text-gray-500">
                Swipe left or right to see more courses
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6 mx-auto">
              <BookOpen className="text-gray-400" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No Popular Courses Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We're working on curating the best courses for you. Check back soon!
            </p>
          </motion.div>
        )}

        {/* View All Button */}
        {popularCourses?.data && popularCourses.data.length > 0 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/courses">
              <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-medium flex items-center gap-2 mx-auto group">
                <Sparkles className="w-5 h-5" />
                View All Sustainability Courses
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PopularCoursesSection;
