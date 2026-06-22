import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UdemyStyleCourseCard from './UdemyStyleCourseCard';
import { ICourse } from '@/types/course';

interface ResponsiveCourseSliderProps {
  courses: ICourse[];
  title?: string;
  showTitle?: boolean;
  className?: string;
}

const ResponsiveCourseSlider = ({ 
  courses, 
  title = "Popular Courses",
  showTitle = true,
  className = "" 
}: ResponsiveCourseSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(4);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Calculate slides to show based on screen size
  useEffect(() => {
    const updateSlidesToShow = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setSlidesToShow(1); // Mobile portrait
      } else if (width < 640) {
        setSlidesToShow(1.5); // Mobile landscape
      } else if (width < 768) {
        setSlidesToShow(2); // Small tablet
      } else if (width < 1024) {
        setSlidesToShow(3); // Tablet
      } else if (width < 1280) {
        setSlidesToShow(4); // Desktop
      } else if (width < 1536) {
        setSlidesToShow(5); // Large desktop
      } else {
        setSlidesToShow(6); // Extra large desktop
      }
    };

    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);
    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  const maxIndex = Math.max(0, courses.length - slidesToShow);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(Math.min(Math.max(index, 0), maxIndex));
  }, [maxIndex]);

  // Handle swipe gestures
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      prevSlide();
    } else if (info.offset.x < -threshold) {
      nextSlide();
    }
  }, [nextSlide, prevSlide]);

  // Auto-scroll functionality with pause on hover
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= maxIndex) {
          return 0; // Reset to beginning
        }
        return prev + 1;
      });
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(interval);
  }, [maxIndex, isHovered]);

  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Title */}
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          
          {/* Navigation buttons for desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="p-2 h-10 w-10 rounded-full border-gray-300 hover:border-gray-400 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="p-2 h-10 w-10 rounded-full border-gray-300 hover:border-gray-400 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Slider Container */}
      <div className="relative overflow-hidden">
        <motion.div
          ref={sliderRef}
          className="flex gap-4 md:gap-6 cursor-grab active:cursor-grabbing"
          animate={{
            x: `-${currentIndex * (100 / slidesToShow)}%`
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          style={{
            width: `${(courses.length / slidesToShow) * 100}%`
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        >
          {courses.map((course, index) => (
            <motion.div
              key={course._id}
              className="flex-shrink-0"
              style={{
                width: `${100 / courses.length}%`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <UdemyStyleCourseCard 
                course={course} 
                variant={slidesToShow === 1 ? 'default' : 'compact'}
                className="h-full"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile Navigation Buttons */}
        <div className="md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm border-gray-300 hover:border-gray-400 disabled:opacity-50 shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm border-gray-300 hover:border-gray-400 disabled:opacity-50 shadow-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 gap-2">
        {Array.from({ length: maxIndex + 1 }, (_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-purple-600 w-6' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
        <motion.div
          className="bg-purple-600 h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ 
            width: `${((currentIndex + 1) / (maxIndex + 1)) * 100}%` 
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export default ResponsiveCourseSlider;
