

export interface VideoResolution {
  url: string;
  quality: string;
  format?: string;
}

export interface ILecture {
  _id: string;
  lectureTitle: string;
  instruction?: string;
  videoUrl?: string;
  videoResolutions?: VideoResolution[];
  hlsUrl?: string;
  /** URL for audio-only lessons (e.g. podcast, narrated content) */
  audioUrl?: string;
  /** Rich text / article content for text-based lessons (HTML or Markdown) */
  articleContent?: string;
  pdfUrl?: string;
  duration?: number;
  isPreviewFree?: boolean;
  courseId: string;
  order: number;
  thumbnailUrl?: string;
  views?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourse {
  progress?: number;
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  courseLevel: string;
  coursePrice?: number;
  courseThumbnail?: string;
  enrolledStudents?: string[];
  totalEnrollment?: number;
  lectures?: ILecture[];
  creator: string | {
    _id: string;
    // The real backend User.name is always an object
    // ({firstName, middleName?, lastName}), never a plain string - kept as
    // a union since some callers defensively handle both shapes.
    name: string | { firstName: string; middleName?: string; lastName: string };
    profileImg?: string;
  };
  isPublished: boolean;
  status: string;
  courseThumbnailPublicId?: string;
  isFree?: string;
  averageRating?: number;
  totalReviews?: number;
  learningObjectives?: string[];
  prerequisites?: string;
  targetAudience?: string;
  createdAt?: Date;
  updatedAt?: Date;
}