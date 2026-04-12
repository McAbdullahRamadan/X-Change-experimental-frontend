
export interface Course {
  id: number;
  title: string;
  category: string;
  categoryKey: string;
  emoji: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessons: number;
  rating: number;
  reviews: number;
  seatsFilled: number;
  joinedCount: number;
  instructorName: string;
  instructorTitle: string;
  instructorInitials: string;
  instructorGradient: string;
  verified: boolean;
  swapAvailable: boolean;
  trending: boolean;
  certificate: boolean;
  featured: boolean;
  enrolledAvatars: { initial: string; color: string }[];
}
