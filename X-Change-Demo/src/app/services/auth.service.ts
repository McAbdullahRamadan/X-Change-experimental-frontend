import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl + '/auth';
  private loggedIn = new BehaviorSubject<boolean>(false);
isLoggedIn$ = this.loggedIn.asObservable();

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data)
      .pipe(
        tap((res: any) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('refreshToken', res.refreshToken);
          this.loggedIn.next(true);
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
  }

  getToken() {
    return localStorage.getItem('token');
  }
  registeruser(data: any) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
