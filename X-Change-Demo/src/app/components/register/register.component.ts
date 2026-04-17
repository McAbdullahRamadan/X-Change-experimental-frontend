import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: '../auth-design/auth-design.component.css'
})
export class RegisterComponent  {
  registerForm!: FormGroup;
  passwordType: string = 'password';
  passwordIcon: string = 'bi-eye-slash';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.initializeForm();
  }

  initializeForm() {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required,Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      email: ['', [Validators.required,Validators.email]],
      confirmEmail: ['', [Validators.required,Validators.email]],
      gender: [''],
      firstName: ['', [Validators.required,Validators.pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/)]],
      password: ['', [Validators.required,Validators.minLength(6),Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/)]],
      phoneNumber: ['', [Validators.required,Validators.pattern(/^01[0125][0-9]{8}$/)]],
      dateOfBirth: ['', [Validators.required,this.ageValidator(16)]],
      city: ['',[Validators.required,]],
      country: ['',[Validators.required,]],
      nationalId: [''],
      university: [''],
      major: ['']
    }, {
      validators: [
        this.emailMatchValidator
      ]
    });
  }

  emailMatchValidator(group: AbstractControl): ValidationErrors | null {
    const email = group.get('email')?.value;
    const confirmEmail = group.get('confirmEmail')?.value;

    if (email && confirmEmail && email !== confirmEmail) {
      group.get('confirmEmail')?.setErrors({ emailMismatch: true });
      return { emailMismatch: true };
    }
    return null;
  }

  ageValidator(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= minAge ? null : { minAge: true };
    };
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
    this.passwordIcon = this.passwordType === 'password' ? 'bi-eye-slash' : 'bi-eye';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (!field) return '';

    if (field.hasError('serverError')) {
      return field.getError('serverError');
    }

    if (field.hasError('required')) {
      return 'This field is required';
    }

    if (field.hasError('email')) {
      return 'The email is invalid';
    }

    if (field.hasError('emailMismatch')) {
      return 'Email does not match';
    }

    if (field.hasError('pattern')) {
      switch(fieldName) {
        case 'userName':
          return 'Only letters, numbers, and _ are allowed';
        case 'firstName':
        case 'lastName':
          return 'Only Arabic or English letters are allowed';
        case 'password':
          return 'It must contain a capital letter, a lowercase letter, and numbers';
        case 'phoneNumber':
          return 'Valid mobile number (11 digits)';
        default:
          return 'Incorrect formula';
      }
    }

    if (field.hasError('minlength')) {
      return 'The password must be at least 6 words long and consist of at least one uppercase letter, at least one lowercase letter, and numbers.';
    }

    if (field.hasError('minAge')) {
      return 'You must be at least 16 years old';
    }

    return '';
  }

  submit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      const invalidFields = Object.keys(this.registerForm.controls).filter(
        key => this.registerForm.get(key)?.invalid
      );

      this.toastr.warning(`There is ${invalidFields.length} Invalid fields`, 'warning', {
        positionClass: 'toast-top-right',
        timeOut: 3000
      });

      const firstInvalidField = Object.keys(this.registerForm.controls).find(
        key => this.registerForm.get(key)?.invalid
      );

      if (firstInvalidField) {
        const element = document.querySelector(`[formControlName="${firstInvalidField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      return;
    }

    if (this.registerForm.value.email !== this.registerForm.value.confirmEmail) {
      this.registerForm.get('confirmEmail')?.setErrors({ emailMismatch: true });
      this.registerForm.get('confirmEmail')?.markAsTouched();

      this.toastr.error('Email does not match', 'Erorr', {
        positionClass: 'toast-top-right',
        timeOut: 4000
      });
      return;
    }

    this.auth.register(this.registerForm.value).subscribe({
      next: (response: any) => {
        if (response?.isSuccess === true) {
          this.toastr.success(
            response?.data || 'Registration successful',
            '🎉Welcome',
            {
              positionClass: 'toast-top-right',
              timeOut: 5000,
              progressBar: true
            }
          );

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          const errorMessage = response?.errors?.[0] || 'Registration failed';

          if (errorMessage.includes('email') || errorMessage.includes('Email')) {
            this.registerForm.get('email')?.setErrors({ serverError: errorMessage });
            this.registerForm.get('email')?.markAsTouched();
          } else if (errorMessage.includes('user') || errorMessage.includes('User')) {
            this.registerForm.get('userName')?.setErrors({ serverError: errorMessage });
            this.registerForm.get('userName')?.markAsTouched();
          } else if (errorMessage.includes('phone') || errorMessage.includes('Phone')) {
            this.registerForm.get('phoneNumber')?.setErrors({ serverError: errorMessage });
            this.registerForm.get('phoneNumber')?.markAsTouched();
          }

          this.toastr.error(errorMessage, 'خطأ', {

          });
        }
      },
      error: (err) => {
        this.toastr.error('An error occurred in connecting to the server', 'Erorr', {

        });
      }
    });
  }

}
