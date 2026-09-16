import { HttpClient } from '@angular/common/http';
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
  city: string;
  country: string;
  university: string;
  major: string;
}
@Injectable({
  providedIn: 'root'
})

export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth`).pipe(
      catchError(error => {
        console.error('Error in getAllUsers:', error);
        return of({ isSuccess: false, data: { items: [] } });
      })
    );
  }
    // ✅ دالة تحديث المستخدم (PUT)
    updateUser(userData: any): Observable<any> {
      console.log('Sending to API:', JSON.stringify(userData, null, 2));

      return this.http.put(`${this.apiUrl}/Auth`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).pipe(
        catchError(error => {
          console.error('Error updating user:', error);
          return of({
            isSuccess: false,
            error: error.error?.message || error.message
          });
        })
      );
    }

  getUserById(id: string): Observable<any> {
    if (!id) {
      console.error('User ID is required');
      return of({ isSuccess: false, data: null, error: 'User ID is required' });
    }

    // إضافة التوكن في الهيدرز إذا كان مطلوباً
    const token = localStorage.getItem('token');
    const headers: any = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.http.get(`${this.apiUrl}/auth/${id}`, { headers }).pipe(
      map(response => {
        // التأكد من أن الاستجابة تحتوي على البيانات المطلوبة
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

  // دالة مساعدة لتحويل البيانات
  mapUserData(data: any): User | null {
    if (!data) return null;

    return {
      id: data.id || '',
      userName: data.userName || data.username || '',
      email: data.email || '',
      phoneNumber: data.phoneNumber || '',
      firstname: data.firstname || data.firstName || '',
      lastname: data.lastname || data.lastName || '',
      city: data.city || '',
      country: data.country || '',
      university: data.university || '',
      major: data.major || ''
    };
  }

}
