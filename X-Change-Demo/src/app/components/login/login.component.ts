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
      return fieldName === 'email' ? 'Email required' : 'Password required';
    }
    if (field.hasError('email') || field.hasError('pattern')) {
      return 'Invalid email address';
    }
    if (field.hasError('minlength')) {
      return 'The password must be at least 8 characters long.';
    }
    return '';
  }

  submit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      const invalidFields = Object.keys(this.loginForm.controls).filter(
        key => this.loginForm.get(key)?.invalid
      );

      this.toastr.warning(`Found ${invalidFields.length} Invalid fields  `, 'worining', {
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
          this.toastr.success( 'Welcome','Logged in Successfully! 🎉', {
            positionClass: 'toast-top-right',
            timeOut: 5000,
            progressBar: true
          });

          if (response?.data?.name) {
            this.toastr.info(`Welcome ${response.data.name}`, 'Welcome back', {
              positionClass: 'toast-top-right'
            });
          }

          setTimeout(() => {
            this.router.navigate(['']);
          }, 2000);
        } else {
          const errorMessage = response?.errors?.[0] || 'Login failed';

          if (errorMessage.includes('email') || errorMessage.includes('Email')) {
            this.loginForm.get('email')?.setErrors({ serverError: errorMessage });
            this.loginForm.get('email')?.markAsTouched();
            this.toastr.error('error','The email address is invalid or does not exist.',  {
              positionClass: 'toast-top-right'
            });
          } else if (errorMessage.includes('password') || errorMessage.includes('Password')) {
            this.loginForm.get('password')?.setErrors({ serverError: errorMessage });
            this.loginForm.get('password')?.markAsTouched();
            this.toastr.error('Incorrect password', 'error', {
              positionClass: 'toast-top-right'
            });
          } else {
            this.toastr.error(errorMessage, 'Login failed', {
              positionClass: 'toast-top-right'
            });
          }
        }
      },
      error: (err) => {
        console.log('HTTP Error:', err);
        this.toastr.error('An error occurred in connecting to the server.', 'error', {
          positionClass: 'toast-top-right'
        });
      }
    });
  }
}
