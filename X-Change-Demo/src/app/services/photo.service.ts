import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';



export interface Photo {
  id: number;
  photoUrl: string;
  publicId: string;
  photoType: number; // 1: profile, 2: cover
  isCurrent: boolean;
  uploadedAt: Date;
  fileName: string;
  fileSize: number;
  formattedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private apiUrl = environment.apiUrl + '/Photos';

  constructor(private http: HttpClient) {}

  /**
   * رفع صورة جديدة
   */
  uploadPhoto(file: File, photoType: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.apiUrl}/upload?photoType=${photoType}`;

    return this.http.post(url, formData, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * تعيين صورة كصورة حالية
   */
  setCurrentPhoto(photoId: number, photoType: number): Observable<any> {
    const url = `${this.apiUrl}/set-current/${photoId}?photoType=${photoType}`;

    return this.http.put(url, {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * حذف صورة
   */
  deletePhoto(publicId: string): Observable<any> {
    const url = `${this.apiUrl}/${publicId}`;

    return this.http.delete(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * ✅ جلب صور مستخدم معين (أضيفي هذه الدالة)
   */
  getUserPhotos(userId: string, photoType?: number): Observable<any> {
    let url = `${this.apiUrl}/user/${userId}`;
    if (photoType) {
      url += `?photoType=${photoType}`;
    }

    console.log('GET photos URL:', url);
    console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');

    return this.http.get(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * جلب صور المستخدم الحالي
   */
  getMyPhotos(photoType?: number): Observable<any> {
    let url = `${this.apiUrl}/my-photos`;
    if (photoType) {
      url += `?photoType=${photoType}`;
    }

    return this.http.get(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * دالة مساعدة لجلب الـ Authorization headers
   */
  private getAuthHeaders(): { [header: string]: string } {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * التحقق من نوع الملف وحجمه
   */
  validateImage(file: File): { valid: boolean; message: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Only JPG, PNG, GIF, and WEBP images are allowed'
      };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        message: 'Image size must be less than 5MB'
      };
    }

    return { valid: true, message: '' };
  }

  /**
   * إنشاء preview للصورة
   */
  createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
