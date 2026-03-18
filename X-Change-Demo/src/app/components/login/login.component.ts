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
      if (this.loginForm.get('email')?.invalid && this.loginForm.get('password')?.invalid) {
        this.toastr.warning('البريد الإلكتروني وكلمة السر مطلوبان', 'تحذير');
      } else if (this.loginForm.get('email')?.invalid) {
        this.toastr.warning('البريد الإلكتروني مطلوب أو غير صحيح', 'تحذير');
      } else if (this.loginForm.get('password')?.invalid) {
        this.toastr.warning('كلمة السر مطلوبة (6 أحرف على الأقل)', 'تحذير');
      }
      return;
    }

    if (this.loginForm.valid) {
      this.auth.login(this.loginForm.value)
        .subscribe({
          next: (response: any) => {
            console.log('Full response:', response);

            // التحقق من isSuccess في الـ response
            if (response?.isSuccess === true) {
              // تسجيل دخول ناجح
              this.toastr.success('تم تسجيل الدخول بنجاح! 🎉', 'مرحباً بك');
              if (response?.data?.name) {
                this.toastr.info(`مرحباً ${response.data.name}`, 'أهلاً بك');
              }
              this.router.navigate(['']);
            } else {
              // تسجيل دخول فاشل (isSuccess = false)
              const errorMessage = response?.errors?.[0] || 'فشل تسجيل الدخول';

              if (errorMessage.includes('email')) {
                this.toastr.error('البريد الإلكتروني غير صحيح أو غير موجود', 'خطأ');
              } else if (errorMessage.includes('password')) {
                this.toastr.error('كلمة السر غير صحيحة', 'خطأ');
              } else {
                this.toastr.error(errorMessage, 'فشل تسجيل الدخول');
              }
            }
          },
          error: err => {
            console.log('HTTP Error:', err);
            // هذا الكود مش هيشتغل كتير لأن الباك إند دايمًا بيدور 200
            this.toastr.error('حدث خطأ في الاتصال بالخادم', 'خطأ');
          }
        });
    }
  }
}
