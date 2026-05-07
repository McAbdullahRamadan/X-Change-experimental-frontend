import { Injectable } from '@angular/core';
import { Course, CourseDetail, CourseFilter, CourseProgress, CreateLesson, CreateSection, Lesson, LessonProgress, Section, UpdateLesson, UpdateSection } from '../components_admin/ModelsData/CouresesModel';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
export interface CourseListResponse {
  items: Course[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginatedResponseCours<T> {
  isSuccess: boolean;
  data: {
    items: T[];
    totalCount: number;
    pageNumber: number;
    totalPages: number;
  };
  message?: string;
}

// إضافة واجهات جديدة للأقسام (Sections) API
export interface CreateSectionRequest {
  courseId: number;
  title: string;
  description: string;
  orderNumber: number;
}

export interface UpdateSectionRequest {
  title?: string;
  description?: string;
  orderNumber?: number;
}

export interface SectionResponse {
  id: number;
  courseId: number;
  title: string;
  description: string;
  orderNumber: number;
  totalDuration: number;
  lessonsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message: string;
  statusCode: number;
}

export interface BulkSectionOrderRequest {
  sections: { id: number; orderNumber: number }[];
}
@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private apiUrl = `${environment.apiUrl}/Courses`;

  constructor(private http: HttpClient) {}

  // ========== Course Endpoints ==========

  getAllCourses(filter: CourseFilter): Observable<PaginatedResponseCours<Course>> {
    let params = new HttpParams()
      .set('Page', filter.page.toString())
      .set('PageSize', filter.pageSize.toString());

    if (filter.search) params = params.set('Search', filter.search);
    if (filter.level) params = params.set('Level', filter.level);
    if (filter.category) params = params.set('Category', filter.category);
    if (filter.isPublished !== undefined) params = params.set('IsPublished', filter.isPublished);
    if (filter.sortBy) params = params.set('SortBy', filter.sortBy);
    if (filter.sortOrder) params = params.set('SortOrder', filter.sortOrder);

    console.log('📤 API Request:', `${this.apiUrl}`, { params: params.toString() });

    return this.http.get<CourseListResponse>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        return {
          isSuccess: true,
          data: {
            items: response.items || [],
            totalCount: response.totalCount || 0,
            pageNumber: response.pageNumber || 1,
            totalPages: response.totalPages || 0
          }
        };
      }),
      catchError(error => {
        console.error('❌ API Error:', error);
        return of({
          isSuccess: false,
          data: {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            totalPages: 0
          },
          message: error.message || 'Failed to load courses'
        });
      })
    );
  }

  getPublishedCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/published`);
  }

  getCourseById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  getCourseDetails(id: number): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.apiUrl}/${id}/details`);
  }

  getMyCreatedCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/me/created`);
  }

  createCourse(courseData: any): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/CreateCourse`, courseData);
  }

  updateCourse(id: number, courseData: any): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/${id}`, courseData);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publishCourse(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/publish`, {});
  }

  // ========== Section Endpoints (المضافة والمحدثة) ==========

  getCourseSections(courseId: number): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.apiUrl}/${courseId}/sections`);
  }

  createSection(courseId: number, section: CreateSection): Observable<Section> {
    return this.http.post<Section>(`${this.apiUrl}/sections`, { ...section, courseId });
  }

  updateSection(sectionId: number, section: UpdateSection): Observable<Section> {
    return this.http.put<Section>(`${this.apiUrl}/sections/${sectionId}`, section);
  }

  deleteSection(sectionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sections/${sectionId}`);
  }

  /**
   * إضافة قسم جديد إلى كورس معين
   * POST /api/Courses/sections
   * @param section - بيانات القسم (courseId, title, description, orderNumber)
   */
  addCourseSection(section: CreateSectionRequest): Observable<ApiResponse<SectionResponse>> {
    console.log('📤 Adding section to course:', section);

    return this.http.post<ApiResponse<SectionResponse>>(`${this.apiUrl}/sections`, section)
      .pipe(
        map(response => {
          if (!response.isSuccess) {
            throw new Error(response.message || 'Failed to add section');
          }
          return response;
        }),
        catchError(error => {
          console.error('❌ Failed to add section:', error);
          return of({
            isSuccess: false,
            data: null as any,
            message: error.error?.message || error.message || 'Failed to add section',
            statusCode: error.status || 500
          });
        })
      );
  }

  /**
   * إضافة أقسام متعددة إلى كورس دفعة واحدة
   * POST /api/Courses/sections/batch
   */
  addMultipleSections(sections: CreateSectionRequest[]): Observable<ApiResponse<SectionResponse[]>> {
    return this.http.post<ApiResponse<SectionResponse[]>>(`${this.apiUrl}/sections/batch`, sections)
      .pipe(
        catchError(error => {
          console.error('❌ Failed to add multiple sections:', error);
          return of({
            isSuccess: false,
            data: [],
            message: error.error?.message || error.message || 'Failed to add sections',
            statusCode: error.status || 500
          });
        })
      );
  }

  /**
   * الحصول على جميع الأقسام لكورس معين
   * GET /api/Courses/sections/course/{courseId}
   */
  getSectionsByCourseId(courseId: number): Observable<ApiResponse<SectionResponse[]>> {
    return this.http.get<ApiResponse<SectionResponse[]>>(`${this.apiUrl}/sections/course/${courseId}`)
      .pipe(
        catchError(error => {
          console.error('❌ Failed to fetch sections:', error);
          return of({
            isSuccess: false,
            data: [],
            message: error.error?.message || error.message || 'Failed to fetch sections',
            statusCode: error.status || 500
          });
        })
      );
  }

  /**
   * تحديث قسم موجود
   * PUT /api/Courses/sections/{sectionId}
   */
  updateSectionById(sectionId: number, section: UpdateSectionRequest): Observable<ApiResponse<SectionResponse>> {
    return this.http.put<ApiResponse<SectionResponse>>(`${this.apiUrl}/sections/${sectionId}`, section)
      .pipe(
        catchError(error => {
          console.error('❌ Failed to update section:', error);
          return of({
            isSuccess: false,
            data: null as any,
            message: error.error?.message || error.message || 'Failed to update section',
            statusCode: error.status || 500
          });
        })
      );
  }

  /**
   * حذف قسم
   * DELETE /api/Courses/sections/{sectionId}
   */
  deleteSectionById(sectionId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/sections/${sectionId}`)
      .pipe(
        catchError(error => {
          console.error('❌ Failed to delete section:', error);
          return of({
            isSuccess: false,
            data: null,
            message: error.error?.message || error.message || 'Failed to delete section',
            statusCode: error.status || 500
          });
        })
      );
  }

  /**
   * إعادة ترتيب الأقسام لكورس معين
   * PUT /api/Courses/sections/reorder/{courseId}
   */
  reorderCourseSections(courseId: number, sections: { id: number; orderNumber: number }[]): Observable<ApiResponse<SectionResponse[]>> {
    const request: BulkSectionOrderRequest = { sections };
    return this.http.put<ApiResponse<SectionResponse[]>>(`${this.apiUrl}/sections/reorder/${courseId}`, request)
      .pipe(
        catchError(error => {
          console.error('❌ Failed to reorder sections:', error);
          return of({
            isSuccess: false,
            data: [],
            message: error.error?.message || error.message || 'Failed to reorder sections',
            statusCode: error.status || 500
          });
        })
      );
  }

  /**
   * الحصول على قسم محدد بواسطة معرفه
   * GET /api/Courses/sections/{sectionId}
   */
  getSectionById(sectionId: number): Observable<ApiResponse<SectionResponse>> {
    return this.http.get<ApiResponse<SectionResponse>>(`${this.apiUrl}/sections/${sectionId}`)
      .pipe(
        catchError(error => {
          console.error('❌ Failed to fetch section:', error);
          return of({
            isSuccess: false,
            data: null as any,
            message: error.error?.message || error.message || 'Failed to fetch section',
            statusCode: error.status || 500
          });
        })
      );
  }

  // ========== Lesson Endpoints ==========

  getSectionLessons(sectionId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/sections/${sectionId}/lessons`);
  }

  getLessonById(lessonId: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/lessons/${lessonId}`);
  }

  // ✅ تعديل createLesson - استخدم FromForm
  createLesson(lessonData: FormData): Observable<Lesson> {
    // ✅ الرابط الصحيح: /api/Courses/lessons (بدون معاملات في الرابط)
    return this.http.post<Lesson>(`${this.apiUrl}/lessons`, lessonData);
  }

  // ✅ تعديل updateLesson
  updateLesson(lessonId: number, lessonData: FormData): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/lessons/${lessonId}`, lessonData);
  }

  deleteLesson(lessonId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lessons/${lessonId}`);
  }

  // ========== Progress Endpoints ==========

  markLessonCompleted(lessonId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/lessons/${lessonId}/complete`, {});
  }

  markLessonUncompleted(lessonId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/lessons/${lessonId}/uncomplete`, {});
  }

  updateWatchTime(lessonId: number, watchTimeSeconds: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/lessons/${lessonId}/watch-time`, watchTimeSeconds);
  }

  getLessonProgress(lessonId: number): Observable<LessonProgress> {
    return this.http.get<LessonProgress>(`${this.apiUrl}/lessons/${lessonId}/progress`);
  }

  getCourseProgress(courseId: number): Observable<CourseProgress> {
    return this.http.get<CourseProgress>(`${this.apiUrl}/${courseId}/progress`);
  }
}
