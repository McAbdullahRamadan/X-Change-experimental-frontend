export interface EducatorVerification {
  id: number;
  userId: string;
  userFullName: string;
  userEmail: string;
  userAvatar?: string;
  nationalIdDocUrl: string;
  universityDocUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}