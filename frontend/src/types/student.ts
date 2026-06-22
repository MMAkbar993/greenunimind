// Student type definitions

export interface IEnrolledCourse {
  courseId: string;
  completedLectures: string[];
  certificateGenerated?: boolean;
  enrolledAt?: Date;
}

export interface IStudent {
  _id: string;
  user: string;
  name: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  gender: 'male' | 'female' | 'other';
  email: string;
  profileImg?: string;
  enrolledCourses: IEnrolledCourse[];
}
