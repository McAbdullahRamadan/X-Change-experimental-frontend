import { Component, OnDestroy, OnInit } from '@angular/core';
import { EducatorVerification } from './models/EducatorVerification';
import { VerificationFilter } from './models/VerificationFilter';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EducatorVerificationService } from '../../services/educator-verification.service';

@Component({
  selector: 'app-educator',
  standalone: false,
  templateUrl: './educator.component.html',
  styleUrl: './educator.component.css'
})
export class EducatorComponent  implements OnInit, OnDestroy {
  // البيانات
  verifications: EducatorVerification[] = [];

  // الفلاتر
  filters: VerificationFilter = {
    page: 1,
    pageSize: 10,
    search: '',
    status: '',
    sortBy: 'submittedAt',
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
  showRejectModal = false;
  selectedVerification: EducatorVerification | null = null;

  // نموذج الرفض
  rejectForm: FormGroup;

  // قوائم الفلاتر
  statuses = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // مساعد
  Math = Math;

  private destroy$ = new Subject<void>();

  // ✅ الخصائص المحسوبة
  get pendingCount(): number {
    return this.verifications.filter(v => v.status === 'pending').length;
  }

  get approvedCount(): number {
    return this.verifications.filter(v => v.status === 'approved').length;
  }

  get rejectedCount(): number {
    return this.verifications.filter(v => v.status === 'rejected').length;
  }

  constructor(
    private verificationService: EducatorVerificationService,
    private fb: FormBuilder
  ) {
    this.rejectForm = this.fb.group({
      rejectionReason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadVerifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // تحميل طلبات التحقق
  loadVerifications(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.verificationService.getAllVerifications(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.verifications = response.data.items || [];
            this.totalItems = response.data.totalCount || 0;
            this.totalPages = response.data.totalPages || 0;
            this.currentPage = response.data.pageNumber || 1;
          } else {
            this.errorMessage = response.message || 'Failed to load verifications';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.errorMessage = 'An error occurred while loading verifications';
          this.isLoading = false;
        }
      });
  }

  // تطبيق الفلاتر
  applyFilters(): void {
    this.filters.page = 1;
    this.loadVerifications();
  }
  getUserInitials(fullName: string | undefined): string {
    if (!fullName) return 'U';

    const parts = fullName.split(' ');
    const firstInitial = parts[0]?.charAt(0) || '';
    const secondInitial = parts[1]?.charAt(0) || '';

    return (firstInitial + secondInitial).toUpperCase() || 'U';
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
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }
  // البحث
  onSearchChange(searchTerm: string): void {
    this.filters.search = searchTerm;
    this.filters.page = 1;
    this.loadVerifications();
  }

  // إعادة تعيين الفلاتر
  resetFilters(): void {
    this.filters = {
      page: 1,
      pageSize: 10,
      search: '',
      status: '',
      sortBy: 'submittedAt',
      sortOrder: 'desc'
    };
    this.loadVerifications();
  }

  // الترتيب
  sortBy(field: string): void {
    if (this.filters.sortBy === field) {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sortBy = field;
      this.filters.sortOrder = 'desc';
    }
    this.loadVerifications();
  }

  // الباجينيشن
  prevPage(): void {
    if (this.currentPage > 1) {
      this.filters.page--;
      this.loadVerifications();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.filters.page++;
      this.loadVerifications();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadVerifications();
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

  // عرض تفاصيل الطلب
  viewDetails(verification: EducatorVerification): void {
    this.selectedVerification = verification;
    this.showDetailsModal = true;
  }

  // الموافقة على الطلب
  approveVerification(verification: EducatorVerification): void {
    if (confirm(`Are you sure you want to approve ${verification.userFullName} as an educator?`)) {
      this.verificationService.approveVerification(verification.id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.loadVerifications();
            alert('Educator approved successfully!');
          } else {
            alert(response.error || 'Failed to approve');
          }
        },
        error: () => {
          alert('Failed to approve verification');
        }
      });
    }
  }

  // فتح مودال الرفض
  openRejectModal(verification: EducatorVerification): void {
    this.selectedVerification = verification;
    this.rejectForm.reset();
    this.showRejectModal = true;
  }

  // تأكيد الرفض
  confirmReject(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    const rejectionReason = this.rejectForm.get('rejectionReason')?.value;

    this.verificationService.rejectVerification(this.selectedVerification!.id, rejectionReason).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.loadVerifications();
          this.closeRejectModal();
          alert('Verification request rejected');
        } else {
          alert(response.error || 'Failed to reject');
        }
      },
      error: () => {
        alert('Failed to reject verification');
      }
    });
  }

  // حذف الطلب
  deleteVerification(verification: EducatorVerification): void {
    if (confirm(`Are you sure you want to delete ${verification.userFullName}'s verification request?`)) {
      this.verificationService.deleteVerification(verification.id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.loadVerifications();
            alert('Verification request deleted');
          } else {
            alert(response.error || 'Failed to delete');
          }
        },
        error: () => {
          alert('Failed to delete verification');
        }
      });
    }
  }

  // إغلاق المودالات
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedVerification = null;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedVerification = null;
    this.rejectForm.reset();
  }

  closeModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeDetailsModal();
      this.closeRejectModal();
    }
  }

  // الحصول على لون الحالة
  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'bi bi-clock-history';
      case 'approved': return 'bi bi-check-circle-fill';
      case 'rejected': return 'bi bi-x-circle-fill';
      default: return 'bi bi-question-circle';
    }
  }
}
