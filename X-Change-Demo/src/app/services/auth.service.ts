import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';

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

          // تأكد من اسم الحقل الذي يحتوي على التوكن
          // قد يكون res.token أو res.data.token أو res.accessToken
          const token = res.token || res.data?.token || res.accessToken;

          if (token) {
            localStorage.setItem('token', token);

            // إذا كان هناك refreshToken
            if (res.refreshToken || res.data?.refreshToken) {
              const refreshToken = res.refreshToken || res.data?.refreshToken;
              localStorage.setItem('refreshToken', refreshToken);
            }

            // تحديث حالة تسجيل الدخول
            this.loggedIn.next(true);
            console.log('Logged in status updated to: true');
          } else {
            console.error('No token found in response:', res);
          }
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

  // تحديث دالة getUserIdFromToken لتكون أكثر أماناً
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



}
