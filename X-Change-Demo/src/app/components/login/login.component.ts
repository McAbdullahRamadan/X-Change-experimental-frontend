import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: '../auth-design/auth-design.component.css'
})
export class LoginComponent  {
  loginForm!: FormGroup;
  type: string = "password";
  isText: boolean = false;
  eyeIcone: string = "bi-eye-slash";

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });
  }

  hideShowPass() {
    this.isText = !this.isText;
    this.isText ? this.eyeIcone = "bi-eye" : this.eyeIcone = "bi-eye-slash";
    this.isText ? this.type = "text" : this.type = "password";
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('serverError')) {
      return field.getError('serverError');
    }

    if (field.hasError('required')) {
      return fieldName === 'email' ? 'البريد الإلكتروني مطلوب' : 'كلمة السر مطلوبة';
    }
    if (field.hasError('email') || field.hasError('pattern')) {
      return 'البريد الإلكتروني غير صحيح';
    }
    if (field.hasError('minlength')) {
      return 'كلمة السر على الأقل 6 أحرف';
    }
    return '';
  }

  submit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      const invalidFields = Object.keys(this.loginForm.controls).filter(
        key => this.loginForm.get(key)?.invalid
      );

      this.toastr.warning(`يوجد ${invalidFields.length} حقول غير صحيحة`, 'تحذير', {
        positionClass: 'toast-top-right',
        timeOut: 3000
      });

      const firstInvalidField = Object.keys(this.loginForm.controls).find(
        key => this.loginForm.get(key)?.invalid
      );

      if (firstInvalidField) {
        const element = document.querySelector(`[formControlName="${firstInvalidField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      return;
    }

    this.auth.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        console.log('Full response:', response);

        if (response?.isSuccess === true) {
          this.toastr.success('تم تسجيل الدخول بنجاح! 🎉', 'مرحباً بك', {
            positionClass: 'toast-top-right',
            timeOut: 5000,
            progressBar: true
          });

          if (response?.data?.name) {
            this.toastr.info(`مرحباً ${response.data.name}`, 'أهلاً بك', {
              positionClass: 'toast-top-right'
            });
          }

          setTimeout(() => {
            this.router.navigate(['']);
          }, 2000);
        } else {
          const errorMessage = response?.errors?.[0] || 'فشل تسجيل الدخول';

          if (errorMessage.includes('email') || errorMessage.includes('Email')) {
            this.loginForm.get('email')?.setErrors({ serverError: errorMessage });
            this.loginForm.get('email')?.markAsTouched();
            this.toastr.error('البريد الإلكتروني غير صحيح أو غير موجود', 'خطأ', {
              positionClass: 'toast-top-right'
            });
          } else if (errorMessage.includes('password') || errorMessage.includes('Password')) {
            this.loginForm.get('password')?.setErrors({ serverError: errorMessage });
            this.loginForm.get('password')?.markAsTouched();
            this.toastr.error('كلمة السر غير صحيحة', 'خطأ', {
              positionClass: 'toast-top-right'
            });
          } else {
            this.toastr.error(errorMessage, 'فشل تسجيل الدخول', {
              positionClass: 'toast-top-right'
            });
          }
        }
      },
      error: (err) => {
        console.log('HTTP Error:', err);
        this.toastr.error('حدث خطأ في الاتصال بالخادم', 'خطأ', {
          positionClass: 'toast-top-right'
        });
      }
    });
  }
}
