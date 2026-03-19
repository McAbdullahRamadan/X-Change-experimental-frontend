import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
export interface ApiResponse<T = any> {
  isSuccess: boolean;
  status: number;
  data: T;
  errors: string[] | null;
  statusCode: number;
  succeeded: boolean;
  meta: any;
  message: string;
}
@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private apiUrl = environment.apiUrl + '/auth';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data)
      .pipe(
        tap((res: any) => {
          console.log('Login response in service:', res);

          const token = res.token || res.data?.token || res.accessToken;

          if (token) {
            localStorage.setItem('token', token);

            if (res.refreshToken || res.data?.refreshToken) {
              const refreshToken = res.refreshToken || res.data?.refreshToken;
              localStorage.setItem('refreshToken', refreshToken);
            }

            this.loggedIn.next(true);
            console.log('Logged in status updated to: true');
          } else {
            console.error('No token found in response:', res);
          }
        })
      );
  }

  // ========== FORGOT PASSWORD ==========
  forgotPassword(email: string): Observable<ApiResponse<null>> {
    const params = new HttpParams().set('Email', email);

    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/SendResetPassword`, null, { params })
      .pipe(
        tap((res) => {
          console.log('Forgot password response:', res);
          if (res.isSuccess) {
            console.log('✅', res.message);
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  // تأكيد الكود (GET request)
  confirmResetCode(email: string, code: string): Observable<any> {
    const params = new HttpParams()
      .set('Email', email)
      .set('Code', code);

    return this.http.get(`${this.apiUrl}/confirmresetpassword`, {
      params,
      observe: 'response' // راقب الـ response كامل
    }).pipe(
      map((response: any) => {
        console.log('Status:', response.status);
        console.log('Body:', response.body);

        // لو الـ status 200، ارجع الـ body
        if (response.status === 200) {
          return response.body;
        }

        // لو أي status تاني، اعتبره فشل
        return { isSuccess: false, errors: ['حدث خطأ في الاتصال'] };
      }),
      catchError((error) => {
        console.log('Error in confirmResetCode:', error);
        return throwError(() => ({
          status: error.status,
          message: error.error?.errors?.[0] || 'حدث خطأ في التحقق',
          errors: error.error?.errors || ['حدث خطأ في التحقق']
        }));
      })
    );
  }

  // إعادة تعيين كلمة السر (POST request)
  resetPassword(data: { email: string, newPassword: string }): Observable<any> {

    const formData = new FormData();
    formData.append('Email', data.email);
    formData.append('Password', data.newPassword);
    formData.append('ConfirmPassword', data.newPassword);

    console.log('Sending FormData:', {
      Email: data.email,
      Password: data.newPassword,
      ConfirmPassword: data.newPassword
    });

    return this.http.post(`${this.apiUrl}/ResetPassword`, formData)
      .pipe(
        tap((response) => {
          console.log('Reset password response:', response);
        }),
        catchError((error) => {
          console.log('Error in resetPassword:', error);
          return this.handleError(error);
        })
      );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.loggedIn.next(false);
    console.log('Logged out');
  }

  getUsernameFromToken(): string | null {
    try {
      const token = this.getToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username || payload.unique_name || payload.name || null;
    } catch {
      return null;
    }
  }

  getUserIdFromToken(): string | null {
    try {
      const token = this.getToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.nameid || payload.sub || null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error details:', error);

    let errorMessage = 'An error occurred';
    let errors: string[] = [];

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      const apiError = error.error as ApiResponse;

      if (apiError) {
        if (!apiError.isSuccess && apiError.errors && apiError.errors.length > 0) {
          errors = apiError.errors;
          errorMessage = apiError.errors.join(', ');
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      }

      if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 400) {
        errorMessage = errors.length ? errors.join(', ') : 'Bad request';
      } else if (error.status === 404) {
        errorMessage = 'Email not found';
      } else if (error.status === 500) {
        errorMessage = 'Server error, please try again later';
      }
    }

    console.error('❌ Auth Error:', errorMessage);

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      errors: errors,
      originalError: error
    }));
  }
}
