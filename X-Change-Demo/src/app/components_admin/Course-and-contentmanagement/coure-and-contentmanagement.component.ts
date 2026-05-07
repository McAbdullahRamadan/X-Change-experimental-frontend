import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course, CourseFilter, CourseProgress, Lesson, Section } from '../ModelsData/CouresesModel';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-coure-and-contentmanagement',
  standalone: false,
  templateUrl: './coure-and-contentmanagement.component.html',
  styleUrl: './coure-and-contentmanagement.component.css'
})
export class CoureAndContentmanagementComponent implements OnInit, OnDestroy {
    // Data
  courses: Course[] = [];
  selectedCourse: Course | null = null;
  sections: Section[] = [];
  selectedSection: Section | null = null;
  lessons: Lesson[] = [];
  selectedLesson: Lesson | null = null;
  courseProgress: CourseProgress | null = null;

  // UI State
  isLoading = false;
  errorMessage = '';
  selectedTab: 'courses' | 'sections' | 'progress' = 'courses';
  expandedSections: { [key: number]: boolean } = {};

  // Modals
  showCourseModal = false;
  showSectionModal = false;
  showLessonModal = false;
  modalMode: 'add' | 'edit' = 'add';

  // Forms
  courseForm: FormGroup;
  sectionForm: FormGroup;
  lessonForm: FormGroup;

  // Filters
  filters: CourseFilter = {
    page: 1,
    pageSize: 10,
    search: '',
    isPublished: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Options
  courseLevels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
  lessonMediaTypes = ['None', 'EmbedUrl', 'Upload'];

  // Video Upload
  selectedVideoFile: File | null = null;
  videoPreviewUrl: string | null = null;
  isUploading = false;
  uploadProgress = 0;

  private destroy$ = new Subject<void>();
  Math = Math;

  constructor(
    private courseService: CourseService,
    private fb: FormBuilder
  ) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      level: ['Beginner', Validators.required],
      category: ['', Validators.required],
      whatYouWillLearn: [''],
      requirements: [''],
      targetAudience: ['']
    });

    this.sectionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      orderNumber: [0]
    });

    this.lessonForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: [''],
      duration: [5, [Validators.required, Validators.min(1), Validators.max(360)]],
      orderNumber: [0],
      mediaType: ['None'],
      videoUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== Course Methods ==========

  loadCourses(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.courseService.getAllCourses(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.courses = response.data.items || [];
            this.totalItems = response.data.totalCount || 0;
            this.totalPages = response.data.totalPages || 0;
            this.currentPage = response.data.pageNumber || 1;
          } else {
            this.errorMessage = response.message || 'Failed to load courses';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.errorMessage = 'An error occurred while loading courses';
          this.isLoading = false;
        }
      });
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      pageSize: 10,
      search: '',
      isPublished: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.loadCourses();
  }

  selectCourse(course: Course): void {
    this.selectedCourse = course;
    this.selectedTab = 'sections';
    this.loadSections(course.id);
    this.loadCourseProgress(course.id);
  }

  loadSections(courseId: number): void {
    this.isLoading = true;

    // ✅ إذا كان عندك endpoint يجلب sections مع lessons
    this.courseService.getCourseSections(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sections) => {
          console.log('✅ Sections with lessons loaded:', sections);
          this.sections = sections;

          if (this.sections.length > 0 && !this.expandedSections[this.sections[0].id]) {
            this.expandedSections[this.sections[0].id] = true;
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading sections:', error);
          this.errorMessage = 'An error occurred while loading sections';
          this.isLoading = false;
        }
      });
  }
  loadCourseProgress(courseId: number): void {
    this.courseService.getCourseProgress(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progress) => {
          this.courseProgress = progress;
        },
        error: (error) => {
          console.error('Error loading progress:', error);
          // Mock progress
          this.courseProgress = {
            courseId: courseId,
            courseTitle: this.selectedCourse?.title || '',
            totalLessons: 24,
            completedLessons: 8,
            progressPercent: 33,
            totalWatchTimeMinutes: 180,
            lastAccessedAt: new Date(),
            sectionsProgress: [],
            lessonsProgress: []
          };
        }
      });
  }

  toggleSection(sectionId: number): void {
    this.expandedSections[sectionId] = !this.expandedSections[sectionId];
  }

  selectSection(section: Section): void {
    console.log('🖱️ Section selected:', section);
    this.selectedSection = section;
    this.lessons = section.lessons;
  }

  // ========== Video Upload Methods ==========

  onVideoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file (MP4, WebM, AVI)');
        return;
      }

      if (file.size > 500 * 1024 * 1024) {
        alert('Video file too large. Maximum 500MB');
        return;
      }

      this.selectedVideoFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.videoPreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  clearSelectedVideo(): void {
    this.selectedVideoFile = null;
    this.videoPreviewUrl = null;
    const videoInput = document.getElementById('videoFileInput') as HTMLInputElement;
    if (videoInput) videoInput.value = '';
  }

  // ========== Modal Methods ==========

  openAddCourseModal(): void {
    this.modalMode = 'add';
    this.courseForm.reset({
      title: '',
      description: '',
      price: 0,
      level: 'Beginner',
      category: '',
      whatYouWillLearn: '',
      requirements: '',
      targetAudience: ''
    });
    this.showCourseModal = true;
  }

  openEditCourseModal(course: Course): void {
    this.modalMode = 'edit';
    this.courseForm.patchValue(course);
    this.selectedCourse = course;
    this.showCourseModal = true;
  }

  openAddSectionModal(): void {
    if (!this.selectedCourse) return;
    this.modalMode = 'add';
    this.sectionForm.reset({
      title: '',
      description: '',
      orderNumber: this.sections.length + 1
    });
    this.showSectionModal = true;
  }

  openEditSectionModal(section: Section): void {
    this.modalMode = 'edit';
    this.sectionForm.patchValue(section);
    this.selectedSection = section;
    this.showSectionModal = true;
  }

  openAddLessonModal(): void {
    console.log('🔍 openAddLessonModal called');
    console.log('📌 selectedSection:', this.selectedSection);

    if (!this.selectedSection) {
      console.warn('❌ No section selected!');
      alert('Please select a section first by clicking on it');
      return;
    }

    // ✅ تأكد إن الـ ID موجود
    console.log('📌 Section ID:', this.selectedSection.id);

    this.modalMode = 'add';
    this.lessonForm.reset({
      title: '',
      content: '',
      duration: 5,
      orderNumber: this.selectedSection.lessons.length + 1,
      mediaType: 'None',
      videoUrl: ''
    });
    this.clearSelectedVideo();
    this.showLessonModal = true;
  }

  openAddLessonWithSection(sectionId: number, event: Event): void {
    event.stopPropagation();

    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      this.selectedSection = section;
      this.openAddLessonModal();
    }
  }

  openEditLessonModal(lesson: Lesson): void {
    this.modalMode = 'edit';
    this.lessonForm.patchValue(lesson);
    this.selectedLesson = lesson;
    this.showLessonModal = true;
  }

  // ========== Save Methods ==========

  saveCourse(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    // ✅ تجهيز البيانات كـ JSON بالشكل المطلوب
    const courseData = {
      title: this.courseForm.value.title,
      description: this.courseForm.value.description,
      price: this.courseForm.value.price,
      level: this.getCourseLevelNumber(this.courseForm.value.level), // تحويل النص إلى رقم
      language: 'en',
      thumbnailUrl: null,
      thumbnailPublicId: null
    };

    console.log('📤 Sending course data:', courseData);

    const request = this.modalMode === 'add'
      ? this.courseService.createCourse(courseData)
      : this.courseService.updateCourse(this.selectedCourse!.id, courseData);

    request.subscribe({
      next: (response) => {
        console.log('✅ Course saved:', response);
        this.loadCourses();
        this.closeCourseModal();
      },
      error: (error) => {
        console.error('❌ Failed to save course:', error);
        alert('Failed to save course: ' + (error.error?.message || error.message));
      }
    });
  }
  private getCourseLevelNumber(level: string): number {
    switch (level) {
      case 'Beginner': return 1;
      case 'Intermediate': return 2;
      case 'Advanced': return 3;
      case 'All Levels': return 4;
      default: return 1;
    }
  }
  saveSection(): void {
    if (this.sectionForm.invalid || !this.selectedCourse) return;

    const request = this.modalMode === 'add'
      ? this.courseService.createSection(this.selectedCourse.id, this.sectionForm.value)
      : this.courseService.updateSection(this.selectedSection!.id, this.sectionForm.value);

    request.subscribe({
      next: () => {
        this.loadSections(this.selectedCourse!.id);
        this.closeSectionModal();
      },
      error: (error) => alert('Failed to save section: ' + error.message)
    });
  }

  saveLesson(): void {
    if (this.lessonForm.invalid || !this.selectedSection) {
      console.error('Form invalid or no section selected');
      return;
    }

    const formData = new FormData();
    const lessonValue = this.lessonForm.value;

    // ✅ أضف الـ SectionId
    formData.append('SectionId', this.selectedSection.id.toString());
    formData.append('Title', lessonValue.title);
    formData.append('Content', lessonValue.content || '');
    formData.append('Duration', lessonValue.duration.toString());
    formData.append('OrderNumber', lessonValue.orderNumber.toString());
    formData.append('MediaType', lessonValue.mediaType);

    if (lessonValue.videoUrl) {
      formData.append('VideoUrl', lessonValue.videoUrl);
    }

    if (this.selectedVideoFile) {
      formData.append('VideoFile', this.selectedVideoFile);
    }

    // ✅ طباعة البيانات اللي هتترسل
    console.log('📤 Sending lesson data:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    this.isUploading = true;

    // ✅ استخدم createLesson بدون sectionId في المعامل
    this.courseService.createLesson(formData).subscribe({
      next: (response) => {
        console.log('✅ Lesson created:', response);
        this.loadSections(this.selectedCourse!.id);
        this.closeLessonModal();
        this.isUploading = false;
        this.clearSelectedVideo();
      },
      error: (error) => {
        console.error('❌ Failed to save lesson:', error);
        alert('Failed to save lesson: ' + (error.error?.message || error.message));
        this.isUploading = false;
      }
    });
  }

  // ========== Delete Methods ==========

  deleteCourse(id: number): void {
    if (confirm('Are you sure you want to delete this course?')) {
      this.courseService.deleteCourse(id).subscribe({
        next: () => {
          this.loadCourses();
          if (this.selectedCourse?.id === id) {
            this.selectedCourse = null;
            this.sections = [];
            this.selectedTab = 'courses';
          }
        },
        error: (error) => alert('Failed to delete course: ' + error.message)
      });
    }
  }

  deleteSection(id: number): void {
    if (confirm('Are you sure you want to delete this section?')) {
      this.courseService.deleteSection(id).subscribe({
        next: () => {
          this.loadSections(this.selectedCourse!.id);
        },
        error: (error) => alert('Failed to delete section: ' + error.message)
      });
    }
  }

  deleteLesson(id: number): void {
    if (confirm('Are you sure you want to delete this lesson?')) {
      this.courseService.deleteLesson(id).subscribe({
        next: () => {
          this.loadSections(this.selectedCourse!.id);
        },
        error: (error) => alert('Failed to delete lesson: ' + error.message)
      });
    }
  }

  publishCourse(id: number): void {
    this.courseService.publishCourse(id).subscribe({
      next: () => this.loadCourses(),
      error: (error) => alert('Failed to publish course: ' + error.message)
    });
  }

  // ========== Modal Close Methods ==========

  closeCourseModal(): void {
    this.showCourseModal = false;
    this.selectedCourse = null;
    this.courseForm.reset();
  }

  closeSectionModal(): void {
    this.showSectionModal = false;
    this.selectedSection = null;
    this.sectionForm.reset();
  }

  closeLessonModal(): void {
    this.showLessonModal = false;
    this.selectedLesson = null;
    this.lessonForm.reset();
    this.clearSelectedVideo();
  }

  closeModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeCourseModal();
      this.closeSectionModal();
      this.closeLessonModal();
    }
  }

  // ========== Helper Methods ==========

  getStatusClass(isPublished: boolean): string {
    return isPublished ? 'status-published' : 'status-draft';
  }

  getStatusText(isPublished: boolean): string {
    return isPublished ? 'Published' : 'Draft';
  }

  getLevelClass(level: string): string {
    switch (level.toLowerCase()) {
      case 'beginner': return 'level-beginner';
      case 'intermediate': return 'level-intermediate';
      case 'advanced': return 'level-advanced';
      default: return 'level-all';
    }
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  getProgressColor(percent: number): string {
    if (percent < 30) return '#e74a3b';
    if (percent < 70) return '#f6c23e';
    return '#35f157';
  }

  // ========== Pagination ==========

  prevPage(): void {
    if (this.currentPage > 1) {
      this.filters.page--;
      this.loadCourses();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.filters.page++;
      this.loadCourses();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadCourses();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
