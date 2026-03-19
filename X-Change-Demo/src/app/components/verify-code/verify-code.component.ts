import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-verify-code',
  standalone: false,
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.css'
})
export class VerifyCodeComponent implements OnInit, OnDestroy {
  verifyForm: FormGroup;
  isLoading = false;
  email: string = '';
  timer: number = 60;
  canResend: boolean = false;
  timerInterval: any;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.verifyForm = this.fb.group({
      code: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^[0-9]{6}$/)
      ]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.toastr.warning('البريد الإلكتروني مطلوب', 'تحذير', {
          positionClass: 'toast-top-right'
        });
        this.router.navigate(['/forgot-password']);
      }
    });

    this.startTimer();
  }

  startTimer() {
    this.timer = 60;
    this.canResend = false;

    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.canResend = true;
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.verifyForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.verifyForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('serverError')) {
      return field.getError('serverError');
    }

    if (field.hasError('required')) {
      return 'كود التحقق مطلوب';
    }
    if (field.hasError('pattern') || field.hasError('minlength') || field.hasError('maxlength')) {
      return 'كود التحقق يجب أن يكون 6 أرقام';
    }
    return '';
  }

  onSubmit() {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      this.toastr.warning('يرجى إدخال كود التحقق بشكل صحيح', 'تحذير', {
        positionClass: 'toast-top-right',
        timeOut: 3000
      });
      return;
    }

    this.isLoading = true;
    const code = this.verifyForm.get('code')?.value;

    console.log('Sending code:', code, 'for email:', this.email);

    this.auth.confirmResetCode(this.email, code).subscribe({
      next: (response: any) => {
        console.log('Response:', response);
        this.isLoading = false;

        // تحقق من الـ response body
        // الباك إند دايمًا بيدور 200، لازم نقرأ isSuccess من الـ body
        if (response?.isSuccess === true || response?.message?.includes('successfully')) {
          // نجاح
          this.toastr.success('تم التحقق بنجاح', '✔️', {
            positionClass: 'toast-top-right',
            timeOut: 2000,
            progressBar: true
          });

          // التوجيه لصفحة reset-password
          setTimeout(() => {
            this.router.navigate(['/reset-password'], {
              queryParams: {
                email: this.email,
                code: code
              }
            });
          }, 1000);
        } else {
          // فشل - الباك إند بيدور 200 لكن isSuccess = false
          console.log('Verification failed:', response);

          let errorMessage = 'كود التحقق غير صحيح';

          // قراءة الأخطاء من الـ response body
          if (response?.errors && response.errors.length > 0) {
            errorMessage = response.errors[0];
          } else if (response?.message) {
            errorMessage = response.message;
          }

          // عرض رسالة الخطأ
          this.toastr.error(errorMessage, 'خطأ', {
            positionClass: 'toast-top-right',
            timeOut: 3000
          });

          // تعيين الخطأ في حقل الكود
          this.verifyForm.get('code')?.setErrors({
            serverError: errorMessage
          });
          this.verifyForm.get('code')?.markAsTouched();
        }
      },
      error: (err) => {
        console.log('HTTP Error:', err);
        this.isLoading = false;

        // هذا الكود مش هيتنفذ عشان الباك إند دايمًا بيدور 200
        // لكن بنحطه للأمان
        let errorMessage = 'حدث خطأ في الاتصال بالخادم';

        if (err.errors && err.errors.length > 0) {
          errorMessage = err.errors[0];
        } else if (err.message) {
          errorMessage = err.message;
        }

        this.toastr.error(errorMessage, 'خطأ', {
          positionClass: 'toast-top-right',
          timeOut: 3000
        });
      }
    });
  }

  resendCode() {
    if (!this.canResend) return;

    this.isLoading = true;

    this.auth.forgotPassword(this.email).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        if (response?.isSuccess === true) {
          this.toastr.success('تم إعادة إرسال الكود بنجاح', 'تم الإرسال', {
            positionClass: 'toast-top-right',
            timeOut: 3000
          });

          this.startTimer();
        } else {
          const errorMessage = response?.errors?.[0] || 'فشل إعادة الإرسال';
          this.toastr.error(errorMessage, 'خطأ', {
            positionClass: 'toast-top-right'
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error('فشل إعادة الإرسال، حاول مرة أخرى', 'خطأ', {
          positionClass: 'toast-top-right'
        });
      }
    });
  }
}
