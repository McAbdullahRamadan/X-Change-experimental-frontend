import { Component, OnDestroy, OnInit } from '@angular/core';
import { User, UserFilter, UserService } from '../../services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-mangement',
  standalone: false,
  templateUrl: './user-mangement.component.html',
  styleUrl: './user-mangement.component.css'
})
export class UserMangementComponent  implements OnInit, OnDestroy {
   // البيانات
  users: User[] = [];
  selectedUsers: { [key: string]: boolean } = {};

  // الفلاتر
  filters: UserFilter = {
    page: 1,
    pageSize: 10,
    search: '',
    status: '',
    country: '',
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

  // المودال
  showUserModal = false;
  showDeleteModal = false;
  modalMode: 'add' | 'edit' | 'view' = 'add';
  userForm: FormGroup;
  selectedUserId: string | null = null;
  userToDelete: User | null = null;

  // قوائم للفلاتر
  countries = ['Egypt', 'Saudi Arabia', 'UAE', 'Pakistan', 'India', 'Bangladesh', 'Afghanistan', 'USA', 'UK', 'Canada'];
  statuses = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  // مساعد
  Math = Math;

  private destroy$ = new Subject<void>();

  // ✅ الخصائص المحسوبة (Computed Properties)
  get totalUsersCount(): number {
    return this.users.length;
  }

  get activeUsersCount(): number {
    return this.users.filter(u => u.isActive).length;
  }

  get educatorsCount(): number {
    return this.users.filter(u => u.roles?.includes('educator')).length;
  }

  get corporateCount(): number {
    return this.users.filter(u => u.roles?.includes('corporate')).length;
  }

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      country: ['', Validators.required],
      city: [''],
      university: [''],
      major: [''],
      role: ['user', Validators.required]  // ✅ إضافة حقل role
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ دالة مساعدة للحصول على دور المستخدم
  getUserRole(user: User): string {
    if (user.roles && user.roles.length > 0) {
      return user.roles[0];
    }
    return 'user';
  }

  // تحميل المستخدمين من الـ API
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getAllUsers(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);
          this.isLoading = false;

          // ✅ التحقق من نجاح الاستجابة
          if (response && response.isSuccess && response.data) {

            // ✅ معالجة البيانات
            this.users = (response.data.items || []).map((user: any) => ({
              id: user.id,
              firstname: user.firstName || user.firstname || '',
              lastname: user.lastName || user.lastname || '',
              fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`,
              userName: user.userName || '',
              email: user.email || '',
              phoneNumber: user.phoneNumber || '',
              country: user.country || '',
              city: user.city || '',
              university: user.university || '',
              major: user.major || '',
              createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
              isActive: user.isActive === true,
              totalXp: user.totalXp || 0,
              level: user.level || 1,
              roles: user.roles || [],
              profilePictureUrl: user.profilePictureUrl
            }));

            // ✅ تحديث الباجينيشن
            this.totalItems = response.data.totalCount || 0;
            this.totalPages = response.data.totalPages || 0;
            this.currentPage = response.data.pageNumber || 1;
            this.selectedUsers = {};

          } else {
            this.users = [];
            this.errorMessage = response?.message || 'Failed to load users';
          }
        },
        error: (error) => {
          console.error('API Error:', error);
          this.isLoading = false;
          this.users = [];
          this.errorMessage = error.message || 'Failed to connect to server';
        }
      });
  }


  // تطبيق الفلاتر
  applyFilters(): void {
    this.filters.page = 1;
    this.loadUsers();
  }

  // البحث مع debounce
  onSearchChange(searchTerm: string): void {
    this.filters.search = searchTerm;
    this.filters.page = 1;
    this.loadUsers();
  }

  // إعادة تعيين الفلاتر
  resetFilters(): void {
    this.filters = {
      page: 1,
      pageSize: 10,
      search: '',
      status: '',
      country: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.loadUsers();
  }

  // الترتيب
  sortBy(field: string): void {
    if (this.filters.sortBy === field) {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sortBy = field;
      this.filters.sortOrder = 'desc';
    }
    this.loadUsers();
  }

  // التنقل بين الصفحات
  prevPage(): void {
    if (this.currentPage > 1) {
      this.filters.page--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.filters.page++;
      this.loadUsers();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadUsers();
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

  // تحديد كل المستخدمين
  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.users.forEach(user => {
      this.selectedUsers[user.id] = checked;
    });
  }

  get isAllSelected(): boolean {
    return this.users.length > 0 && this.users.every(user => this.selectedUsers[user.id]);
  }

  // تصدير البيانات
  exportUsers(): void {
    this.userService.exportUsers(this.filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Export feature will be available soon');
      }
    });
  }

  // فتح مودال إضافة مستخدم
  openAddUserModal(): void {
    this.modalMode = 'add';
    this.selectedUserId = null;
    this.userForm.reset({
      firstname: '',
      lastname: '',
      email: '',
      phoneNumber: '',
      country: '',
      city: '',
      university: '',
      major: '',
      role: 'user'  // ✅ القيمة الافتراضية
    });
    this.userForm.enable();
    this.showUserModal = true;
  }

  // عرض تفاصيل المستخدم
  viewUser(user: User): void {
    this.modalMode = 'view';
    this.selectedUserId = user.id;
    this.userForm.patchValue({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      city: user.city,
      university: user.university,
      major: user.major,
      role: this.getUserRole(user)  // ✅ عرض الدور الحالي
    });
    this.userForm.disable();
    this.showUserModal = true;
  }

  // تعديل المستخدم
  editUser(user: User): void {
    this.modalMode = 'edit';
    this.selectedUserId = user.id;
    this.userForm.patchValue({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      city: user.city,
      university: user.university,
      major: user.major,
      role: this.getUserRole(user)  // ✅ عرض الدور الحالي للتعديل
    });
    this.userForm.enable();
    this.showUserModal = true;
  }

  // حذف المستخدم
  deleteUser(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  // تأكيد الحذف
  confirmDelete(): void {
    if (this.userToDelete) {
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.loadUsers();
          } else {
            alert(response.error || 'Failed to delete user');
          }
          this.closeDeleteModal();
        },
        error: () => {
          this.users = this.users.filter(u => u.id !== this.userToDelete?.id);
          this.totalItems = this.users.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.closeDeleteModal();
        }
      });
    }
  }

  // تغيير حالة المستخدم
  toggleUserStatus(user: User): void {
    this.userService.toggleUserStatus(user.id, !user.isActive).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          user.isActive = !user.isActive;
        } else {
          alert(response.error || 'Failed to update user status');
        }
      },
      error: () => {
        alert('Failed to update user status');
      }
    });
  }

  // حفظ المستخدم (إضافة أو تعديل)
  saveUser(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    const userData = this.userForm.value;
    const selectedRole = userData.role;  // ✅ جلب الدور المحدد
    delete userData.role;  // ✅ إزالة الدور من البيانات الأساسية (سيتم إضافته بشكل منفصل)

    if (this.modalMode === 'add') {
      // ✅ إنشاء مستخدم جديد مع الدور
      const newUserData = {
        ...userData,
        roles: [selectedRole]  // ✅ إضافة الدور كمصفوفة
      };

      this.userService.createUser(newUserData).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.loadUsers();
            this.closeModal();
          } else {
            alert(response.error || 'Failed to create user');
          }
        },
        error: () => {
          // Mock create for demo
          const newUser: User = {
            id: Date.now().toString(),
            ...userData,
            fullName: `${userData.firstname} ${userData.lastname}`,
            userName: userData.email.split('@')[0],
            createdAt: new Date(),
            isActive: true,
            totalXp: 0,
            level: 1,
            roles: [selectedRole]
          };
          this.users.unshift(newUser);
          this.totalItems++;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.closeModal();
        }
      });
    } else if (this.modalMode === 'edit' && this.selectedUserId) {
      // ✅ تحديث المستخدم مع الدور
      const updatedUserData = {
        ...userData,
        id: this.selectedUserId,
        roles: [selectedRole]  // ✅ تحديث الدور
      };

      this.userService.updateUser(updatedUserData).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.loadUsers();
            this.closeModal();
          } else {
            alert(response.error || 'Failed to update user');
          }
        },
        error: () => {
          // Mock update for demo
          const index = this.users.findIndex(u => u.id === this.selectedUserId);
          if (index !== -1) {
            this.users[index] = {
              ...this.users[index],
              ...userData,
              fullName: `${userData.firstname} ${userData.lastname}`,
              roles: [selectedRole]
            };
          }
          this.closeModal();
        }
      });
    }
  }

  // إغلاق المودال
  closeModal(): void {
    this.showUserModal = false;
    this.userForm.enable();
    this.userForm.reset();
    this.selectedUserId = null;
  }

  closeModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeModal();
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  closeDeleteModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeDeleteModal();
    }
  }

  // الحصول على لون الصورة الرمزية
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

  // الحصول على أيقونة الدور
  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin': return 'bi bi-shield-lock-fill';
      case 'educator': return 'bi bi-mortarboard-fill';
      case 'corporate': return 'bi bi-building-fill';
      case 'user': return 'bi bi-person-fill';
      default: return 'bi bi-person-fill';
    }
  }
}