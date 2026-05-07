// ========== Course Models ==========
export interface Course {
  id: number;
  title: string;
  description?: string;
  instructorId: string;
  instructorName: string;
  instructorProfilePicture?: string;
  price: number;
  isPublished: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt?: Date;
  language: string;
  level: string;
  totalDuration: number;
  thumbnailUrl?: string;
  enrollmentCount: number;
  sectionsCount: number;
  totalLessons: number;

  totalEnrollments: number;
  averageRating: number;
  isFree: boolean;
}

export interface CourseDetail extends Course {
  sections: Section[];
  reviews: Review[];
  whatYouWillLearn: string[];
  requirements: string[];
  targetAudience: string[];
}

// ========== Section Models ==========
export interface Section {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  orderNumber: number;
  totalLessons: number;
  totalDuration: number;
  lessons: Lesson[]
}

export interface CreateSection {
  title: string;
  description?: string;
  orderNumber: number;
}

export interface UpdateSection extends CreateSection {
  id: number;
}

// ========== Lesson Models ==========
export interface Lesson {
  id: number;
  sectionId: number;
  sectionTitle: string;
  title: string;
  content?: string;
  duration: number;
  orderNumber: number;
  mediaType: string;
  videoUrl?: string;
  videoPublicId?: string;
  isCompleted?: boolean;
  progressPercent?: number;
  watchTimeSeconds?: number;
  attachments: LessonAttachment[];
  createdAt: Date;
}

export interface CreateLesson {
  title: string;
  content?: string;
  duration: number;
  orderNumber: number;
  mediaType: string;
  videoUrl?: string;
  videoPublicId?: string;
}

export interface UpdateLesson extends CreateLesson {
  id: number;
}

// ========== Lesson Attachment Models ==========
export interface LessonAttachment {
  id: number;
  lessonId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

// ========== Progress Models ==========
export interface LessonProgress {
  lessonId: number;
  lessonTitle: string;
  isCompleted: boolean;
  watchTimeSeconds: number;
  durationSeconds: number;
  progressPercent: number;
  completedAt?: Date;
  lastAccessedAt: Date;
}

export interface SectionProgress {
  sectionId: number;
  sectionTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  lessons: LessonProgress[];
}

export interface CourseProgress {
  courseId: number;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  totalWatchTimeMinutes: number;
  lastAccessedAt?: Date;
  sectionsProgress: SectionProgress[];
  lessonsProgress: LessonProgress[];
}

// ========== Review Models ==========
export interface Review {
  id: number;
  rating: number;
  comment: string;
  userName: string;
  userAvatar?: string;
  createdAt: Date;
}

// ========== Filter & Pagination ==========
export interface CourseFilter { page: number;
  pageSize: number;
  search?: string;
  level?: string;
  category?: string;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}