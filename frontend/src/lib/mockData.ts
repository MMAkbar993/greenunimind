export interface Lecture {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number; // in seconds
  isPreview: boolean;
  pdfUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  lectures: Lecture[];
}

export interface UserProgress {
  lectureId: string;
  completed: boolean;
  lastPosition: number; // video time in seconds
  notes: string;
}

export interface UserCourseProgress {
  courseId: string;
  enrolled: boolean;
  lectureProgress: UserProgress[];
  lastAccessedLectureId: string;
}

// Mock data for a single course
export const mockCourse: Course = {
  id: "react-mastery",
  title: "React Mastery: From Fundamentals to Advanced Concepts",
  description:
    "Master React.js with this comprehensive course covering the fundamentals through advanced concepts like hooks, context API, and state management.",
  instructor: "Sarah Johnson",
  thumbnail:
    "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  lectures: [
    {
      id: "lecture-1",
      title: "Introduction to React",
      description:
        "An overview of React and its core concepts. We'll discuss what React is, why it's popular, and set up our development environment.",
      videoUrl:
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
      duration: 600, // 10 minutes
      isPreview: true,
    },
    {
      id: "lecture-2",
      title: "Components and Props",
      description:
        "Learn about React components and how to pass data between them using props. We'll cover functional and class components.",
      videoUrl:
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
      duration: 900, // 15 minutes
      isPreview: false,
    },
    {
      id: "lecture-3",
      title: "State and Lifecycle",
      description:
        "Understanding state in React components and the component lifecycle. Learn when and how to update component state efficiently.",
      videoUrl:
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
      duration: 1200, // 20 minutes
      isPreview: false,
    },
    {
      id: "lecture-4",
      title: "Handling Events",
      description:
        "Learn how to handle user interactions and events in React applications. We'll cover event handlers, synthetic events, and best practices.",
      videoUrl:
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
      duration: 900, // 15 minutes
      isPreview: false,
    },
    {
      id: "lecture-5",
      title: "Forms and Controlled Components",
      description:
        "Master form handling in React using controlled components. Learn how to manage form state and validation effectively.",
      videoUrl:
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
      duration: 1500, // 25 minutes
      isPreview: false,
      pdfUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
  ],
};

// Mock user progress data
export const mockUserProgress: UserCourseProgress = {
  courseId: "react-mastery",
  enrolled: true,
  lastAccessedLectureId: "lecture-2",
  lectureProgress: [
    {
      lectureId: "lecture-1",
      completed: true,
      lastPosition: 580,
      notes:
        "Great introduction to React! Remember to install Node.js before setting up a new project.",
    },
    {
      lectureId: "lecture-2",
      completed: false,
      lastPosition: 350,
      notes:
        "Props are immutable. Remember to use state for data that changes over time.",
    },
    {
      lectureId: "lecture-3",
      completed: false,
      lastPosition: 0,
      notes: "",
    },
    {
      lectureId: "lecture-4",
      completed: false,
      lastPosition: 0,
      notes: "",
    },
    {
      lectureId: "lecture-5",
      completed: false,
      lastPosition: 0,
      notes: "",
    },
  ],
};

export const getCompletedLecturesCount = (
  progress: UserCourseProgress
): number => {
  return progress.lectureProgress.filter((lecture) => lecture.completed).length;
};

export const getTotalLecturesCount = (course: Course): number => {
  return course.lectures.length;
};

export const getCompletionPercentage = (
  progress: UserCourseProgress,
  course: Course
): number => {
  const completed = getCompletedLecturesCount(progress);
  const total = getTotalLecturesCount(course);
  return Math.round((completed / total) * 100);
};

export const getEstimatedTimeLeft = (
  progress: UserCourseProgress,
  course: Course
): number => {
  const completedLectures = new Set(
    progress.lectureProgress
      .filter((lp) => lp.completed)
      .map((lp) => lp.lectureId)
  );

  return course.lectures
    .filter((lecture) => !completedLectures.has(lecture.id))
    .reduce((total, lecture) => total + lecture.duration, 0);
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const getLectureProgress = (
  lectureId: string,
  userProgress: UserCourseProgress
): UserProgress | undefined => {
  return userProgress.lectureProgress.find(
    (progress) => progress.lectureId === lectureId
  );
};

export const canAccessLecture = (
  lectureId: string,
  course: Course,
  userProgress: UserCourseProgress
): boolean => {
  // Always allow access to preview lectures
  const lecture = course.lectures.find((l) => l.id === lectureId);
  if (lecture?.isPreview) {
    return true;
  }

  // If not enrolled, only preview lectures are accessible
  if (!userProgress.enrolled) {
    return false;
  }

  // Get index of the lecture
  const lectureIndex = course.lectures.findIndex((l) => l.id === lectureId);

  // If it's the first lecture, always allow access
  if (lectureIndex === 0) {
    return true;
  }

  // Check if previous lecture is completed
  const previousLectureId = course.lectures[lectureIndex - 1].id;
  const previousLectureProgress = getLectureProgress(
    previousLectureId,
    userProgress
  );

  return previousLectureProgress?.completed || false;
};

export const getNextLectureId = (
  currentLectureId: string,
  course: Course
): string | null => {
  const currentIndex = course.lectures.findIndex(
    (l) => l.id === currentLectureId
  );
  if (currentIndex === -1 || currentIndex >= course.lectures.length - 1) {
    return null;
  }
  return course.lectures[currentIndex + 1].id;
};

export const getPreviousLectureId = (
  currentLectureId: string,
  course: Course
): string | null => {
  const currentIndex = course.lectures.findIndex(
    (l) => l.id === currentLectureId
  );
  if (currentIndex <= 0) {
    return null;
  }
  return course.lectures[currentIndex - 1].id;
};
