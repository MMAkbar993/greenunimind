import { useGetPopularCoursesQuery } from "@/redux/features/course/courseApi";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ICourse } from "@/types/course";

const PopularCourseSection = () => {
  const { data: popularCoursesData, isLoading } = useGetPopularCoursesQuery(8); // Fetch top 8 courses

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center mb-10">
          <Skeleton className="h-8 w-64 mb-4 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-[380px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const courses = popularCoursesData?.data || [];

  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Courses</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most sought-after courses and start learning from industry experts
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {courses.map((course: ICourse) => (
            <motion.div key={course._id} variants={itemVariants}>
              <CourseCard course={course} showPrice={true} />
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg">
            <Link to="/courses">View All Courses</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PopularCourseSection;
