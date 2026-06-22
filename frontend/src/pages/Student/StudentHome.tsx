import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  mockCourse,
  mockUserProgress,
} from "@/lib/mockData";
import { BookOpen,PlayCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const StudentHome = () => {
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-edu-light">
      {/* Header */}
      <Navbar />

      {/* Hero section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to your Learning Journey
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Track your progress, complete lectures, and earn your certificate
            with our intuitive course platform.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/student/dashboard">View Dashboard</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to={`/course/${mockCourse.id}`}>
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Course
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Course preview section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* <div>
              <h2 className="text-3xl font-bold mb-6">
                Continue Your Learning
              </h2>
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{mockCourse.title}</span>
                  <span className="font-semibold text-edu-purple">
                    {completionPercentage}%
                  </span>
                </div>
                <ProgressBar percentage={completionPercentage} size="lg" />
              </div>
              <p className="text-gray-600 mb-6">{mockCourse.description}</p>
              <Button asChild>
                <Link
                  to={`/course/${mockCourse.id}/lecture/${mockUserProgress.lastAccessedLectureId}`}
                >
                  Continue Learning
                </Link>
              </Button>
            </div> */}

            <div className="relative">
              <img
                src={mockCourse.thumbnail}
                alt={mockCourse.title}
                className="w-full rounded-xl shadow-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="icon"
                  className="rounded-full h-16 w-16 bg-edu-purple/90 hover:bg-edu-purple"
                  asChild
                >
                  <Link
                    to={`/course/${mockCourse.id}/lecture/${
                      mockUserProgress.lectureProgress?.[0]?.lectureId ||
                      mockCourse.lectures[0].id
                    }`}
                  >
                    <PlayCircle className="h-8 w-8" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentHome;
