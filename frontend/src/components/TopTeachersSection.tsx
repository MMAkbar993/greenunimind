import { Star } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface TeacherCardProps {
  name: string;
  specialization: string;
  rating: number;
  totalStudents: number;
  totalCourses: number;
  totalHours: number;
  imageSrc: string;
}

const TeacherCard = ({
  name,
  specialization,
  rating,
  totalStudents,
  totalCourses,
  totalHours,
  imageSrc,
}: TeacherCardProps) => (
  <Card className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer">
    {/* Teacher Photo - Full image display like Udemy */}
    <div className="p-2">
      <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-gray-50">
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>

    {/* Card Content - Compact and clean */}
    <div className="p-4">
      {/* Teacher Name */}
      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{name}</h3>

      {/* Specialization */}
      <p className="text-sm text-gray-600 mb-3 font-medium">{specialization}</p>

      {/* Rating Section - Compact */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-bold text-base text-gray-900">{rating.toFixed(1)}</span>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={
                i < Math.floor(rating)
                  ? "text-amber-400 fill-amber-400"
                  : "text-gray-300"
              }
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-1">
          ({totalStudents.toLocaleString()})
        </span>
      </div>

      {/* Stats - Compact horizontal layout */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-center">
          <div className="font-bold text-gray-900">{totalStudents.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Students</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-900">{totalCourses}</div>
          <div className="text-xs text-gray-500">Courses</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-900">{totalHours}</div>
          <div className="text-xs text-gray-500">Hours</div>
        </div>
      </div>
    </div>
  </Card>
);

const TopTeachersSection = () => {
  const teachers = [
    {
      name: "Dr. Sarah Johnson",
      specialization: "Climate Science & Policy",
      rating: 4.9,
      totalStudents: 45230,
      totalCourses: 12,
      totalHours: 48.5,
      imageSrc: "/images/teacher1.png",
    },
    {
      name: "Michael Chen",
      specialization: "Renewable Energy Systems",
      rating: 4.8,
      totalStudents: 38750,
      totalCourses: 8,
      totalHours: 32.0,
      imageSrc: "/images/teacher2.png",
    },
    {
      name: "Dr. Emily Rodriguez",
      specialization: "Sustainable Agriculture",
      rating: 4.9,
      totalStudents: 52100,
      totalCourses: 15,
      totalHours: 67.5,
      imageSrc: "/images/teacher3.png",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-50 to-white">
      <div className="responsive-container">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-600 text-sm font-semibold rounded-full mb-4">
            Expert Sustainability Educators
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
            Top-Rated Environmental Teachers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Learn from leading environmental experts and sustainability educators who are passionate about creating positive change
          </p>
        </div>

        {/* Teachers Grid - Better spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {teachers.map((teacher, index) => (
            <TeacherCard
              key={index}
              name={teacher.name}
              specialization={teacher.specialization}
              rating={teacher.rating}
              totalStudents={teacher.totalStudents}
              totalCourses={teacher.totalCourses}
              totalHours={teacher.totalHours}
              imageSrc={teacher.imageSrc}
            />
          ))}
        </div>

        {/* View All Teachers Button */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12">
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-3 text-base font-semibold border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            View All Educators
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TopTeachersSection;
