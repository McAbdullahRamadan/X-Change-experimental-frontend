import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: '../auth-design/auth-design.component.css'
})
export class LoginComponent  {  loginForm!: FormGroup;
  type: string = "password";
  isText: boolean = false;
  eyeIcone: string = "bi-eye-slash";

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
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

  // إظهار/إخفاء الباسورد
  hideShowPass() {
    this.isText = !this.isText;
    this.isText ? this.eyeIcone = "bi-eye" : this.eyeIcone = "bi-eye-slash";
    this.isText ? this.type = "text" : this.type = "password";
  }

  // التحقق من وجود خطأ في الحقل
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // رسائل الخطأ المخصصة
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
      return 'كلمة السر على الأقل 6 ';
    }

    return '';
  }

  submit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.loginForm.valid) {
      this.auth.login(this.loginForm.value)
        .subscribe({
          next: () => {
            alert('Logged in successfully! 🎉');
            this.router.navigate(['']);
          },
          error: err => {
            console.log(err);
            if (err.status === 401) {
              alert('البريد الإلكتروني أو كلمة السر غير صحيحة');
            } else {
              alert(err.error?.message || 'Login failed');
            }
          }
        });
    }
  }
}
