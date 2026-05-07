import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment.development';
export interface User {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string;
  firstname: string;
  lastname: string;
  fullName?: string;
  city: string;
  country: string;
  university: string;
  major: string;
  isActive?: boolean;
  createdAt?: Date;
  totalXp?: number;
  level?: number;
  profilePictureUrl?: string;
  roles?: string[];
}

export interface UserFilter {
  page: number;
  pageSize: number;  search?: string;
  status?: string;
  country?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

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
@Injectable({
  providedIn: 'root'
})

export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ✅ 1. جلب جميع المستخدمين مع Pagination والـ Filters
  getAllUsers(filter: UserFilter): Observable<PaginatedResponse<User>> {
    let params = new HttpParams()
      .set('Page', filter.page.toString())
      .set('PageSize', filter.pageSize.toString());

    if (filter.search) params = params.set('Search', filter.search);
    if (filter.status) params = params.set('Status', filter.status);
    if (filter.country) params = params.set('Country', filter.country);
    if (filter.sortBy) params = params.set('SortBy', filter.sortBy);
    if (filter.sortOrder) params = params.set('SortOrder', filter.sortOrder);

    // ✅ الرابط الصحيح: /api/Auth (مش /api/Auth/users)
    return this.http.get<PaginatedResponse<User>>(`${this.apiUrl}/Auth`, { params });
  }

  // ✅ 2. تحديث المستخدم
  updateUser(userData: any): Observable<any> {
    console.log('Sending to API:', JSON.stringify(userData, null, 2));

    return this.http.put(`${this.apiUrl}/Auth`, userData).pipe(
      catchError(error => {
        console.error('Error updating user:', error);
        return of({
          isSuccess: false,
          error: error.error?.message || error.message
        });
      })
    );
  }

  // ✅ 3. جلب مستخدم بواسطة ID
  getUserById(id: string): Observable<any> {
    if (!id) {
      console.error('User ID is required');
      return of({ isSuccess: false, data: null, error: 'User ID is required' });
    }

    return this.http.get(`${this.apiUrl}/Auth/${id}`).pipe(
      map(response => {
        if (response && typeof response === 'object') {
          return response;
        }
        return { isSuccess: false, data: null };
      }),
      catchError(error => {
        console.error('Error in getUserById:', error);
        return of({
          isSuccess: false,
          data: null,
          error: error.message || 'Failed to fetch user data'
        });
      })
    );
  }

  // ✅ 4. حذف مستخدم (Soft Delete)
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Auth/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting user:', error);
        return of({
          isSuccess: false,
          error: error.message || 'Failed to delete user'
        });
      })
    );
  }

  // ✅ 5. إنشاء مستخدم جديد
  createUser(userData: Partial<User>): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/register`, userData).pipe(
      catchError(error => {
        console.error('Error creating user:', error);
        return of({
          isSuccess: false,
          error: error.error?.message || error.message
        });
      })
    );
  }

  // ✅ 6. تصدير المستخدمين إلى CSV
  exportUsers(filter: UserFilter): Observable<Blob> {
    let params = new HttpParams();
    if (filter.search) params = params.set('Search', filter.search);
    if (filter.status) params = params.set('Status', filter.status);
    if (filter.country) params = params.set('Country', filter.country);

    return this.http.get(`${this.apiUrl}/Auth/users/export`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting users:', error);
        throw error;
      })
    );
  }

  // ✅ 7. تغيير حالة المستخدم (Activate/Deactivate)
  toggleUserStatus(id: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/Auth/${id}/status`, { isActive }).pipe(
      catchError(error => {
        console.error('Error toggling user status:', error);
        return of({
          isSuccess: false,
          error: error.message || 'Failed to update user status'
        });
      })
    );
  }

  // ✅ 8. دالة مساعدة لتحويل البيانات
  mapUserData(data: any): User | null {
    if (!data) return null;

    return {
      id: data.id || '',
      userName: data.userName || data.username || '',
      email: data.email || '',
      phoneNumber: data.phoneNumber || '',
      firstname: data.firstname || data.firstName || '',
      lastname: data.lastname || data.lastName || '',
      fullName: `${data.firstname || data.firstName || ''} ${data.lastname || data.lastName || ''}`.trim(),
      city: data.city || '',
      country: data.country || '',
      university: data.university || '',
      major: data.major || '',
      isActive: data.isActive,
      createdAt: data.createdAt,
      totalXp: data.totalXp,
      level: data.level,
      profilePictureUrl: data.profilePictureUrl,
      roles: data.roles || []
    };
  }
}
