import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, map, Observable, of, timeout } from 'rxjs';
import { ModerationFilter, ModerationFlag, ModerationStatistics } from '../components_admin/educator/models/moderation';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ModerationService {
  private apiUrl = `${environment.apiUrl}/Moderation`;

  constructor(private http: HttpClient) {}

  // ✅ جلب جميع البلاغات مع Pagination والـ Filters
  getAllFlags(filter: ModerationFilter): Observable<PaginatedResponse<ModerationFlag>> {
    // بناء الـ Params
    let params = new HttpParams()
      .set('Page', filter.page.toString())
      .set('PageSize', filter.pageSize.toString());

    // إضافة الفلاتر الاختيارية
    if (filter.search && filter.search.trim()) {
      params = params.set('Search', filter.search.trim());
    }

    if (filter.status && filter.status.trim()) {
      params = params.set('Status', filter.status);
    }

    if (filter.targetType && filter.targetType.trim()) {
      params = params.set('TargetType', filter.targetType);
    }

    if (filter.sortBy && filter.sortBy.trim()) {
      params = params.set('SortBy', filter.sortBy);
    }

    if (filter.sortOrder && filter.sortOrder.trim()) {
      params = params.set('SortOrder', filter.sortOrder);
    }

    console.log('📤 API Request:', `${this.apiUrl}/Moderation`, { params: params.toString() });

    return this.http.get<PaginatedResponse<ModerationFlag>>(`${this.apiUrl}`, { params }).pipe(
      timeout(30000), // ✅ Timeout 30 seconds
      map(response => {
        console.log('📥 API Response:', response);

        if (response && response.isSuccess && response.data) {
          // ✅ تحويل التواريخ من string إلى Date object
          const items = response.data.items?.map(item => ({
            ...item,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined
          })) || [];

          return {
            ...response,
            data: {
              ...response.data,
              items: items
            }
          };
        }

        return response;
      }),
      catchError(error => {
        console.error('❌ API Error - getAllFlags:', error);

        // ✅ معالجة الأخطاء المختلفة
        let errorMessage = 'Failed to load flags';

        if (error.name === 'TimeoutError') {
          errorMessage = 'Request timeout. Please try again.';
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to access this resource.';
        } else if (error.status === 404) {
          errorMessage = 'API endpoint not found.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        return of({
          isSuccess: false,
          data: {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            totalPages: 0
          },
          message: errorMessage
        });
      })
    );
  }

  // ✅ جلب إحصائيات البلاغات
  getStatistics(): Observable<{ isSuccess: boolean; data: ModerationStatistics }> {
    console.log('📤 API Request:', `${this.apiUrl}/statistics`);

    return this.http.get<{ isSuccess: boolean; data: ModerationStatistics }>(`${this.apiUrl}/statistics`).pipe(
      timeout(30000),
      map(response => {
        console.log('📥 API Response - Statistics:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ API Error - getStatistics:', error);
        return of({
          isSuccess: false,
          data: {
            totalFlags: 0,
            newFlags: 0,
            underReviewFlags: 0,
            resolvedFlags: 0,
            rejectedFlags: 0,
            flagsByType: {},
            flagsByStatus: {},
            topReporters: [],
            averageResolutionTimeHours: 0
          }
        });
      })
    );
  }

  // ✅ جلب بلاغ محدد
  getFlagById(id: number): Observable<any> {
    console.log('📤 API Request:', `${this.apiUrl}/${id}`);

    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      timeout(30000),
      catchError(error => {
        console.error('❌ API Error - getFlagById:', error);
        return of({
          isSuccess: false,
          data: null,
          message: error.message || 'Failed to load flag details'
        });
      })
    );
  }

  // ✅ إنشاء بلاغ جديد
  createFlag(targetType: string, targetId: string, reason: string): Observable<any> {
    const body = { targetType, targetId, reason };
    console.log('📤 API Request - POST:', this.apiUrl, body);

    return this.http.post(this.apiUrl, body).pipe(
      timeout(30000),
      catchError(error => {
        console.error('❌ API Error - createFlag:', error);
        return of({
          isSuccess: false,
          message: error.message || 'Failed to submit report'
        });
      })
    );
  }

  // ✅ حل البلاغ (Accept)
  resolveFlag(id: number, actionTaken: string, notes?: string): Observable<any> {
    const body = { actionTaken, notes };
    console.log('📤 API Request - PUT:', `${this.apiUrl}/${id}/resolve`, body);

    return this.http.put(`${this.apiUrl}/${id}/resolve`, body).pipe(
      timeout(30000),
      catchError(error => {
        console.error('❌ API Error - resolveFlag:', error);
        return of({
          isSuccess: false,
          message: error.message || 'Failed to resolve flag'
        });
      })
    );
  }

  // ✅ رفض البلاغ
  rejectFlag(id: number, notes?: string): Observable<any> {
    const body = { notes };
    console.log('📤 API Request - PUT:', `${this.apiUrl}/${id}/reject`, body);

    return this.http.put(`${this.apiUrl}/${id}/reject`, body).pipe(
      timeout(30000),
      catchError(error => {
        console.error('❌ API Error - rejectFlag:', error);
        return of({
          isSuccess: false,
          message: error.message || 'Failed to reject flag'
        });
      })
    );
  }

  // ✅ حذف البلاغ
  deleteFlag(id: number): Observable<any> {
    console.log('📤 API Request - DELETE:', `${this.apiUrl}/${id}`);

    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      timeout(30000),
      catchError(error => {
        console.error('❌ API Error - deleteFlag:', error);
        return of({
          isSuccess: false,
          message: error.message || 'Failed to delete flag'
        });
      })
    );
  }

  // ✅ دالة مساعدة لبناء الفلاتر (اختياري)
  buildFilters(filter: ModerationFilter): HttpParams {
    let params = new HttpParams()
      .set('Page', filter.page.toString())
      .set('PageSize', filter.pageSize.toString());

    if (filter.search?.trim()) params = params.set('Search', filter.search.trim());
    if (filter.status?.trim()) params = params.set('Status', filter.status);
    if (filter.targetType?.trim()) params = params.set('TargetType', filter.targetType);
    if (filter.sortBy?.trim()) params = params.set('SortBy', filter.sortBy);
    if (filter.sortOrder?.trim()) params = params.set('SortOrder', filter.sortOrder);

    return params;
  }
}
