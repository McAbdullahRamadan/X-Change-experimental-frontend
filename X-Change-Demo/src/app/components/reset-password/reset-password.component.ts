import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetForm: FormGroup;
  isLoading = false;
  isVerifying = true;
  email: string = '';
  code: string = '';
  passwordType: string = 'password';
  passwordIcon: string = 'bi-eye-slash';
  confirmPasswordType: string = 'password';
  confirmPasswordIcon: string = 'bi-eye-slash';
  private sub: any;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    this.sub = this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.code = params['code'] || '';

      if (!this.email || !this.code) {
        this.toastr.warning('بيانات غير صالحة', 'تحذير', {
          positionClass: 'toast-top-right',
          timeOut: 3000
        });
        this.router.navigate(['/forgot-password']);
        return;
      }

      // التحقق من صحة الكود (اختياري)
      // مش بنعمل verify تاني هنا عشان اتأكد قبل كدا
      this.isVerifying = false;
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  hasMinLength(): boolean {
    const value = this.resetForm.get('newPassword')?.value || '';
    return value.length >= 6;
  }

  hasUppercase(): boolean {
    const value = this.resetForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(value);
  }

  hasLowercase(): boolean {
    const value = this.resetForm.get('newPassword')?.value || '';
    return /[a-z]/.test(value);
  }

  hasNumber(): boolean {
    const value = this.resetForm.get('newPassword')?.value || '';
    return /[0-9]/.test(value);
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // لو كانت متطابقة، نشيل أي خطأ سابق
    if (newPassword && confirmPassword && newPassword === confirmPassword) {
      const confirmControl = group.get('confirmPassword');
      if (confirmControl?.hasError('passwordMismatch')) {
        const errors = { ...confirmControl.errors };
        delete errors['passwordMismatch'];
        confirmControl.setErrors(Object.keys(errors).length ? errors : null);
      }
    }

    return null;
  }

  togglePasswordVisibility(field: string) {
    if (field === 'new') {
      this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
      this.passwordIcon = this.passwordType === 'password' ? 'bi-eye-slash' : 'bi-eye';
    } else {
      this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
      this.confirmPasswordIcon = this.confirmPasswordType === 'password' ? 'bi-eye-slash' : 'bi-eye';
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.resetForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('serverError')) {
      return field.getError('serverError');
    }

    if (field.hasError('required')) {
      return fieldName === 'newPassword' ? 'كلمة السر الجديدة مطلوبة' : 'تأكيد كلمة السر مطلوب';
    }

    if (field.hasError('minlength')) {
      return 'كلمة السر على الأقل 6 أحرف';
    }

    if (field.hasError('pattern')) {
      return 'يجب أن تحتوي على حرف كبير وصغير ورقم';
    }

    if (field.hasError('passwordMismatch')) {
      return 'كلمة السر غير متطابقة';
    }

    return '';
  }

  onSubmit() {
    // لو لسه في مرحلة التحقق
    if (this.isVerifying) {
      return;
    }

    // لو الفورم غير صحيح
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();

      const invalidFields = Object.keys(this.resetForm.controls).filter(
        key => this.resetForm.get(key)?.invalid
      );

      this.toastr.warning(`يوجد ${invalidFields.length} حقول غير صحيحة`, 'تحذير', {
        positionClass: 'toast-top-right',
        timeOut: 3000
      });
      return;
    }

    // بدأ التحميل
    this.isLoading = true;
    const newPassword = this.resetForm.get('newPassword')?.value;

    // الباك إند مش بيستقبل code في ResetPassword
    // هو بيستخدم code من ConfirmResetPassword وبعدين بيعمل Reset من غير code
    const resetData = {
      email: this.email,
      newPassword: newPassword
      // code مش مطلوب هنا لأن الباك إند خلاص أكده قبل كدا
    };

    console.log('Sending reset password request:', resetData);

    this.auth.resetPassword(resetData).subscribe({
      next: (response: any) => {
        console.log('Reset Response:', response);

        setTimeout(() => {
          this.isLoading = false;

          // التحقق من isSuccess
          if (response?.isSuccess === true) {
            // نجاح
            this.toastr.success(
              response?.data || response?.message || 'تم تغيير كلمة السر بنجاح',
              '🎉 نجاح',
              {
                positionClass: 'toast-top-right',
                timeOut: 3000,
                progressBar: true,
                closeButton: true
              }
            );

            // رسالة إضافية
            this.toastr.info('سيتم تحويلك إلى صفحة تسجيل الدخول', 'تم', {
              positionClass: 'toast-top-right',
              timeOut: 2000
            });

            // تفريغ الفورم
            this.resetForm.reset();

            // التوجيه إلى صفحة تسجيل الدخول بعد 2.5 ثانية
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2500);

          } else {
            // فشل
            const errors = response?.errors;
            let errorMessage = 'فشل تغيير كلمة السر';

            if (errors && errors.length > 0) {
              errorMessage = errors[0];
            } else if (response?.message) {
              errorMessage = response.message;
            }

            this.toastr.error(errorMessage, 'خطأ', {
              positionClass: 'toast-top-right',
              timeOut: 4000
            });

            // لو الخطأ متعلق بكلمة السر
            if (errorMessage.toLowerCase().includes('password') ||
                errorMessage.toLowerCase().includes('كلمة')) {
              this.resetForm.get('newPassword')?.setErrors({
                serverError: errorMessage
              });
              this.resetForm.get('newPassword')?.markAsTouched();
            }
          }
        }, 500);
      },
      error: (err) => {
        console.log('Error:', err);

        setTimeout(() => {
          this.isLoading = false;

          let errorMessage = 'حدث خطأ في الاتصال بالخادم';

          if (err.errors && err.errors.length > 0) {
            errorMessage = err.errors[0];
          } else if (err.message) {
            errorMessage = err.message;
          }

          this.toastr.error(errorMessage, 'خطأ', {
            positionClass: 'toast-top-right',
            timeOut: 4000
          });
        }, 500);
      }
    });
  }

  // دالة للعودة للخلف
  goBack() {
    this.router.navigate(['/verify-code'], {
      queryParams: { email: this.email }
    });
  }
}