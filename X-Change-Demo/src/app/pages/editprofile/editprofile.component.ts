import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editprofile',
  standalone: false,
  templateUrl:'./editprofile.component.html',
  styleUrl: './editprofile.component.css'
})
export class EditprofileComponent  implements OnInit {
  profileForm!: FormGroup;
  isLoading = true;
  error: string | null = null;
  successMessage: string | null = null;
  userId: string | null = null;
  userData: User | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUserData();
  }

  // تهيئة الفورم
  initForm(): void {
    this.profileForm = this.fb.group({
      id: [''],
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      phoneNumber: [''],
      city: [''],
      country: [''],
      university: [''],
      major: [''],
      personGender: '',  // القيمة الافتراضية
      dateOfBirth: ''
    });
  }

  // جلب بيانات المستخدم
  loadUserData(): void {
    this.isLoading = true;
    this.error = null;

    // التحقق من تسجيل الدخول
    if (!this.authService.isLoggedIn()) {
      this.error = 'Please login to edit profile';
      this.isLoading = false;
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    // الحصول على User ID من التوكن
    this.userId = this.authService.getUserIdFromToken();

    if (!this.userId) {
      this.error = 'Unable to identify user';
      this.isLoading = false;
      return;
    }

    // جلب بيانات المستخدم
    this.userService.getUserById(this.userId).subscribe({
      next: (response: any) => {
        console.log('User data response:', response);

        if (response?.isSuccess && response?.data) {
          this.userData = this.userService.mapUserData(response.data);

          // تحديث الفورم بالبيانات
          if (this.userData) {
            this.profileForm.patchValue({
              id: this.userData.id,
              userName: this.userData.userName,
              email: this.userData.email,
              firstName: this.userData.firstname,
              lastName: this.userData.lastname,
              phoneNumber: this.userData.phoneNumber,
              city: this.userData.city,
              country: this.userData.country,
              university: this.userData.university,
              major: this.userData.major,
              personGender: '',  // القيمة الافتراضية
              dateOfBirth: ''
            });
          }

          this.isLoading = false;
        } else {
          this.error = 'Failed to load user data';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.error = 'Failed to load profile data';
        this.isLoading = false;
      }
    });
  }

  // حفظ التعديلات
  onSubmit(): void {
    debugger;
    debugger;
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const formData = this.profileForm.value;

    const userId = this.authService.getUserIdFromToken();
    if (!userId) {
      this.error = 'User ID not found';
      this.isLoading = false;
      return;
    }

    const dataForApi = {
      id: userId,
      userName: formData.userName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber || "",
      city: formData.city || "",
      country: formData.country || "",
      university: formData.university || "",
      major: formData.major || "",
      personGender: "",
      dateOfBirth: null
    };

    this.userService.updateUser(dataForApi).subscribe({
      next: (response: any) => {
        debugger;
        console.log('Update response:', response);

        if (response?.isSuccess) {
          this.successMessage = 'Profile updated successfully!';

          // ✅ الحل: استخدم username من الفورم مباشرة
          const usernameFromForm = formData.userName;
          console.log('Username from form:', usernameFromForm);

          // ✅ كمان تقدر تجيب username من التوكين كـ fallback
          const usernameFromToken = this.authService.getUsernameFromToken();
          console.log('Username from token:', usernameFromToken);

          // استخدم أي واحد موجود
          const username = usernameFromForm || usernameFromToken;

          if (username) {
            setTimeout(() => {
              this.isLoading = false;
              this.router.navigate(['/profile', username]).then(() => {
                console.log('✅ Navigation successful to:', '/profile/' + username);
              }).catch(err => {
                console.error('❌ Navigation error:', err);
                // لو فشل navigation، جرب الـ Home
                this.router.navigate(['/']);
              });
            }, 1500);
          } else {
            // لو مفيش username خالص، روح للـ Home
            this.error = 'Could not determine username';
            setTimeout(() => {
              this.isLoading = false;
              this.router.navigate(['/']);
            }, 1500);
          }
        } else {
          this.error = response?.error || 'Failed to update profile';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.error = err.error?.message || 'Failed to update profile';
        this.isLoading = false;
      }
    });
  }

  // دالة مساعدة لوضع علامة على كل الحقول
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // العودة لصفحة البروفايل
  cancel(): void {
    // لو الفورم متغير
    if (this.profileForm.dirty) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) {
        return;
      }
    }

    const username = this.authService.getUsernameFromToken();
    if (username) {
      this.router.navigate(['/profile', username]);
    } else {
      this.router.navigate(['/']);
    }
  }

  // التحقق من وجود خطأ في حقل معين
  hasError(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
