import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModerationFilter, ModerationFlag, ModerationStatistics } from '../educator/models/moderation';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ModerationService } from '../../services/moderation.service';

@Component({
  selector: 'app-moderation',
  standalone: false,
  templateUrl: './moderation.component.html',
  styleUrl: './moderation.component.css'
})
export class ModerationComponent implements OnInit, OnDestroy {
  // البيانات
  flags: ModerationFlag[] = [];
  statistics: ModerationStatistics | null = null;

  // الفلاتر
  filters: ModerationFilter = {
    page: 1,
    pageSize: 10,
    search: '',
    status: '',
    targetType: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  // الباجينيشن
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // الحالة
  isLoading = false;
  errorMessage = '';

  // المودالات
  showDetailsModal = false;
  showResolveModal = false;
  showRejectModal = false;
  selectedFlag: ModerationFlag | null = null;

  // نماذج
  resolveForm: FormGroup;
  rejectForm: FormGroup;

  // قوائم الفلاتر
  statuses = [
    { value: '', label: 'All Status' },
    { value: 'New', label: 'New' },
    { value: 'UnderReview', label: 'Under Review' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  targetTypes = [
    { value: '', label: 'All Types' },
    { value: 'Course', label: 'Course' },
    { value: 'Comment', label: 'Comment' },
    { value: 'Post', label: 'Post' },
    { value: 'User', label: 'User' },
    { value: 'LaborExchange', label: 'Labor Exchange' }
  ];

  actionOptions = [
    { value: 'Warning', label: '⚠️ Warning', color: '#f6c23e' },
    { value: 'ContentHidden', label: '👁️ Hide Content', color: '#36b9cc' },
    { value: 'ContentRemoved', label: '🗑️ Remove Content', color: '#e74a3b' },
    { value: 'UserSuspended', label: '⏸️ Suspend User (7 days)', color: '#fd7e14' },
    { value: 'UserBanned', label: '🚫 Ban User', color: '#e74a3b' }
  ];

  // مساعد
  Math = Math;

  private destroy$ = new Subject<void>();

  // ✅ الخصائص المحسوبة
  get newCount(): number {
    return this.statistics?.newFlags || 0;
  }

  get underReviewCount(): number {
    return this.statistics?.underReviewFlags || 0;
  }

  get resolvedCount(): number {
    return this.statistics?.resolvedFlags || 0;
  }

  get rejectedCount(): number {
    return this.statistics?.rejectedFlags || 0;
  }

  get totalCount(): number {
    return this.statistics?.totalFlags || 0;
  }

  constructor(
    private moderationService: ModerationService,
    private fb: FormBuilder
  ) {
    this.resolveForm = this.fb.group({
      actionTaken: ['', Validators.required],
      notes: ['']
    });

    this.rejectForm = this.fb.group({
      notes: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFlags();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // تحميل البلاغات
  loadFlags(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.moderationService.getAllFlags(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.flags = response.data.items || [];
            this.totalItems = response.data.totalCount || 0;
            this.totalPages = response.data.totalPages || 0;
            this.currentPage = response.data.pageNumber || 1;
          } else {
            this.errorMessage = response.message || 'Failed to load flags';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.errorMessage = 'An error occurred while loading flags';
          this.isLoading = false;
        }
      });
  }

  // تحميل الإحصائيات
  loadStatistics(): void {
    this.moderationService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.statistics = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  // تطبيق الفلاتر
  applyFilters(): void {
    this.filters.page = 1;
    this.loadFlags();
  }

  // البحث
  onSearchChange(searchTerm: string): void {
    this.filters.search = searchTerm;
    this.filters.page = 1;
    this.loadFlags();
  }

  // إعادة تعيين الفلاتر
  resetFilters(): void {
    this.filters = {
      page: 1,
      pageSize: 10,
      search: '',
      status: '',
      targetType: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.loadFlags();
  }

  // الترتيب
  sortBy(field: string): void {
    if (this.filters.sortBy === field) {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sortBy = field;
      this.filters.sortOrder = 'desc';
    }
    this.loadFlags();
  }

  // الباجينيشن
  prevPage(): void {
    if (this.currentPage > 1) {
      this.filters.page--;
      this.loadFlags();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.filters.page++;
      this.loadFlags();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadFlags();
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

  // عرض تفاصيل البلاغ
  viewDetails(flag: ModerationFlag): void {
    this.selectedFlag = flag;
    this.showDetailsModal = true;
  }

  // فتح مودال حل البلاغ
  openResolveModal(flag: ModerationFlag): void {
    this.selectedFlag = flag;
    this.resolveForm.reset({ actionTaken: '', notes: '' });
    this.showResolveModal = true;
  }

  // حل البلاغ (قبول)
  confirmResolve(): void {
    if (this.resolveForm.invalid) {
      this.resolveForm.markAllAsTouched();
      return;
    }

    const { actionTaken, notes } = this.resolveForm.value;

    this.moderationService.resolveFlag(this.selectedFlag!.id, actionTaken, notes).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.loadFlags();
          this.loadStatistics();
          this.closeResolveModal();
        } else {
          alert(response.error || 'Failed to resolve flag');
        }
      },
      error: () => {
        alert('Failed to resolve flag');
      }
    });
  }

  // فتح مودال رفض البلاغ
  openRejectModal(flag: ModerationFlag): void {
    this.selectedFlag = flag;
    this.rejectForm.reset({ notes: '' });
    this.showRejectModal = true;
  }

  // رفض البلاغ
  confirmReject(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    const { notes } = this.rejectForm.value;

    this.moderationService.rejectFlag(this.selectedFlag!.id, notes).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.loadFlags();
          this.loadStatistics();
          this.closeRejectModal();
        } else {
          alert(response.error || 'Failed to reject flag');
        }
      },
      error: () => {
        alert('Failed to reject flag');
      }
    });
  }

  // حذف البلاغ
  deleteFlag(flag: ModerationFlag): void {
    if (confirm(`Are you sure you want to delete this flag?`)) {
      this.moderationService.deleteFlag(flag.id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.loadFlags();
            this.loadStatistics();
          } else {
            alert(response.error || 'Failed to delete flag');
          }
        },
        error: () => {
          alert('Failed to delete flag');
        }
      });
    }
  }

  // إغلاق المودالات
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedFlag = null;
  }

  closeResolveModal(): void {
    this.showResolveModal = false;
    this.selectedFlag = null;
    this.resolveForm.reset();
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedFlag = null;
    this.rejectForm.reset();
  }

  closeModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeDetailsModal();
      this.closeResolveModal();
      this.closeRejectModal();
    }
  }

  // الحصول على لون الحالة
  getStatusClass(status: string): string {
    switch (status) {
      case 'New': return 'status-new';
      case 'UnderReview': return 'status-review';
      case 'Resolved': return 'status-resolved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'New': return 'New';
      case 'UnderReview': return 'Under Review';
      case 'Resolved': return 'Resolved';
      case 'Rejected': return 'Rejected';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'New': return 'bi bi-clock-history';
      case 'UnderReview': return 'bi bi-eye';
      case 'Resolved': return 'bi bi-check-circle-fill';
      case 'Rejected': return 'bi bi-x-circle-fill';
      default: return 'bi bi-question-circle';
    }
  }

  getTargetTypeIcon(targetType: string): string {
    switch (targetType) {
      case 'Course': return 'bi bi-book';
      case 'Comment': return 'bi bi-chat';
      case 'Post': return 'bi bi-file-text';
      case 'User': return 'bi bi-person';
      case 'LaborExchange': return 'bi bi-arrow-left-right';
      default: return 'bi bi-flag';
    }
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #35f157, #c700ff)',
      'linear-gradient(135deg, #4e73df, #224abe)',
      'linear-gradient(135deg, #1cc88a, #17a673)',
      'linear-gradient(135deg, #f6c23e, #f4b619)',
      'linear-gradient(135deg, #e74a3b, #c0392b)',
      'linear-gradient(135deg, #36b9cc, #258391)'
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  }

  getActionLabel(action: string): string {
    const option = this.actionOptions.find(o => o.value === action);
    return option ? option.label : action;
  }
}
