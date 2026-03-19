import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isLoading = false;
  isEmailSent = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.forgotForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('serverError')) {
      return field.getError('serverError');
    }

    if (field.hasError('required')) {
      return 'البريد الإلكتروني مطلوب';
    }
    if (field.hasError('email') || field.hasError('pattern')) {
      return 'البريد الإلكتروني غير صحيح';
    }
    return '';
  }

  submit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();

      const invalidFields = Object.keys(this.forgotForm.controls).filter(
        key => this.forgotForm.get(key)?.invalid
      );

      this.toastr.warning(`يوجد ${invalidFields.length} حقول غير صحيحة`, 'تحذير', {
        positionClass: 'toast-top-right',
        timeOut: 3000
      });
      return;
    }

    this.isLoading = true;
    const email = this.forgotForm.get('email')?.value;

    this.auth.forgotPassword(email).subscribe({
      next: (response: any) => {
        console.log('Full Response:', response);
        this.isLoading = false;

        // التحقق من isSuccess في الـ response
        if (response?.isSuccess === true) {
          // نجاح - isSuccess = true
          this.isEmailSent = true;

          this.toastr.success(
            response?.data || 'تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني! 📧',
            'تم الإرسال',
            {
              positionClass: 'toast-top-right',
              timeOut: 5000,
              progressBar: true,
              closeButton: true
            }
          );

          // تفريغ الفورم
          this.forgotForm.reset();
          setTimeout(() => {
            this.router.navigate(['/verify-code'], {
              queryParams: { email: email }
            });
          }, 2000);

        } else {
          // فشل - isSuccess = false
          this.isEmailSent = false;

          // قراءة الأخطاء من الـ errors array
          const errors = response?.errors;
          let errorMessage = 'حدث خطأ غير متوقع';

          if (errors && errors.length > 0) {
            errorMessage = errors[0];
          }

          // التحقق من نوع الخطأ
          if (errorMessage.toLowerCase().includes('user not found') ||
              errorMessage.toLowerCase().includes('email')) {

            // رسالة خطأ للمستخدم
            this.toastr.error('البريد الإلكتروني غير مسجل في النظام', 'خطأ', {
              positionClass: 'toast-top-right',
              timeOut: 4000
            });

            // تعيين خطأ في حقل الإيميل
            this.forgotForm.get('email')?.setErrors({
              serverError: 'البريد الإلكتروني غير مسجل'
            });
            this.forgotForm.get('email')?.markAsTouched();

          } else {
            // رسالة خطأ عامة
            this.toastr.error(errorMessage, 'خطأ', {
              positionClass: 'toast-top-right',
              timeOut: 4000
            });
          }
        }
      },
      error: (err) => {
        // هذا الكود مش هيتنفذ عشان الباك إند دايمًا بيدور 200
        console.log('HTTP Error:', err);
        this.isLoading = false;
        this.isEmailSent = false;

        this.toastr.error('حدث خطأ في الاتصال بالخادم', 'خطأ', {
          positionClass: 'toast-top-right',
          timeOut: 4000
        });
      }
    });
  }

  retry() {
    this.isEmailSent = false;
    this.forgotForm.reset();
    this.forgotForm.get('email')?.setErrors(null); // إزالة أخطاء السيرفر

    this.toastr.info('يمكنك المحاولة مرة أخرى', 'إعادة محاولة', {
      positionClass: 'toast-top-right',
      timeOut: 2000
    });
  }

  resendCode() {
    const email = this.forgotForm.get('email')?.value;

    if (!email) {
      this.toastr.warning('يرجى إدخال البريد الإلكتروني أولاً', 'تحذير', {
        positionClass: 'toast-top-right'
      });
      return;
    }

    this.isLoading = true;

    this.auth.forgotPassword(email).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        if (response?.isSuccess === true) {
          this.toastr.success('تم إعادة إرسال الكود بنجاح', 'تم الإرسال', {
            positionClass: 'toast-top-right',
            timeOut: 3000
          });
        } else {
          const errorMessage = response?.errors?.[0] || 'فشل إعادة الإرسال';
          this.toastr.error(errorMessage, 'خطأ', {
            positionClass: 'toast-top-right'
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('فشل إعادة الإرسال، حاول مرة أخرى', 'خطأ', {
          positionClass: 'toast-top-right'
        });
      }
    });
  }
}
