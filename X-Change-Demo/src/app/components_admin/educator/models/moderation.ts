export interface ModerationFlag {
  id: number;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reporterAvatar?: string;
  targetType: string;
  targetTypeAr: string;
  targetId: string;
  targetTitle: string;
  targetContent: string;
  targetAuthorName: string;
  reason: string;
  status: string;
  statusAr: string;
  actionTaken?: string;
  moderatorId?: string;
  moderatorName?: string;
  notes?: string;
  createdAt: Date;
  resolvedAt?: Date;
  timeToResolveHours: number;
}

export interface ModerationStatistics {
  totalFlags: number;
  newFlags: number;
  underReviewFlags: number;
  resolvedFlags: number;
  rejectedFlags: number;
  flagsByType: { [key: string]: number };
  flagsByStatus: { [key: string]: number };
  topReporters: TopReporter[];
  averageResolutionTimeHours: number;
}

export interface TopReporter {
  reporterId: string;
  reporterName: string;
  reportCount: number;
}

export interface ModerationFilter {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  targetType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}



export interface ResolveFlagRequest {
  actionTaken: string;
  notes?: string;
}

export interface RejectFlagRequest {
  notes?: string;
}