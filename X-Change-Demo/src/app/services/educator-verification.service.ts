import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { VerificationFilter } from '../components_admin/educator/models/VerificationFilter';
import { catchError, map, Observable, of } from 'rxjs';
import { PaginatedResponse } from '../components_admin/educator/models/PaginatedResponse';
import { EducatorVerification } from '../components_admin/educator/models/EducatorVerification';

@Injectable({
  providedIn: 'root'
})
export class EducatorVerificationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // جلب جميع طلبات التحقق
  getAllVerifications(filter: VerificationFilter): Observable<PaginatedResponse<EducatorVerification>> {
    let params = new HttpParams()
      .set('Page', filter.page.toString())
      .set('PageSize', filter.pageSize.toString());

    if (filter.search) params = params.set('Search', filter.search);
    if (filter.status) params = params.set('Status', filter.status);
    if (filter.sortBy) params = params.set('SortBy', filter.sortBy);
    if (filter.sortOrder) params = params.set('SortOrder', filter.sortOrder);

    // ✅ الرابط الصحيح: /api/EducatorVerification
    return this.http.get<PaginatedResponse<EducatorVerification>>(`${this.apiUrl}/EducatorVerification`, { params }).pipe(
      map(response => {
        if (response && response.isSuccess && response.data?.items) {
          response.data.items = response.data.items.map(item => ({
            ...item,
            submittedAt: new Date(item.submittedAt),
            reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : undefined
          }));
        }
        return response;
      }),
      catchError(error => {
        console.error('Error loading verifications:', error);
        return of({
          isSuccess: false,
          data: { items: [], totalCount: 0, pageNumber: 1, totalPages: 0 },
          message: error.message || 'Failed to load verifications'
        });
      })
    );
  }

  // جلب طلب تحقق بواسطة ID
  getVerificationById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/EducatorVerification/${id}`).pipe(
      catchError(error => {
        console.error('Error loading verification:', error);
        return of({ isSuccess: false, data: null, error: error.message });
      })
    );
  }

  // الموافقة على طلب التحقق
  approveVerification(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/EducatorVerification/${id}/approve`, {}).pipe(
      catchError(error => {
        console.error('Error approving verification:', error);
        return of({ isSuccess: false, error: error.message });
      })
    );
  }

  // رفض طلب التحقق
  rejectVerification(id: number, rejectionReason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/EducatorVerification/${id}/reject`, { rejectionReason }).pipe(
      catchError(error => {
        console.error('Error rejecting verification:', error);
        return of({ isSuccess: false, error: error.message });
      })
    );
  }

  // حذف طلب التحقق
  deleteVerification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/EducatorVerification/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting verification:', error);
        return of({ isSuccess: false, error: error.message });
      })
    );
  }
}
