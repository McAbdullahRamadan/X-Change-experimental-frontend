export interface PaginatedResponse<T> {
  isSuccess: boolean;
  data: {
    items: T[];
    totalCount: number;
    pageNumber: number;
    totalPages: number;
  };
  message?: string;
}