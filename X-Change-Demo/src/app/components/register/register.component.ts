import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    private router: Router
  ) {
    this.initializeForm();
  }

  initializeForm() {
    this.registerForm = this.fb.group({
      userName: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9_]+$/) // حروف وأرقام و _
      ]],

      email: ['', [
        Validators.required,
        Validators.email
      ]],

      confirmEmail: ['', [
        Validators.required,
        Validators.email
      ]],

      gender: [''],

      firstName: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/) // عربي أو إنجليزي
      ]],

      lastName: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/)
      ]],

      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/) // حرف كبير + صغير + رقم
      ]],

      phoneNumber: ['', [
        Validators.required,
        Validators.pattern(/^01[0125][0-9]{8}$/) // رقم مصري صحيح
      ]],

      dateOfBirth: ['', [
        Validators.required,
        this.ageValidator(16)
      ]],

      city: ['',[
        Validators.required,
      ]],
      country: ['',[
        Validators.required,
      ]],
      nationalId: [''],
      university: [''],
      major: ['']

    }, {
      validators: [
        this.emailMatchValidator // التحقق من تطابق الإيميل
      ]
    });
  }

  // التحقق من تطابق الإيميل
  emailMatchValidator(group: AbstractControl): ValidationErrors | null {
    const email = group.get('email')?.value;
    const confirmEmail = group.get('confirmEmail')?.value;

    if (email && confirmEmail && email !== confirmEmail) {
      group.get('confirmEmail')?.setErrors({ emailMismatch: true });
      return { emailMismatch: true };
    }
    return null;
  }

  // التحقق من السن
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

  // إظهار/إخفاء الباسورد
  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
    this.passwordIcon = this.passwordType === 'password' ? 'bi-eye-slash' : 'bi-eye';
  }

  // التحقق من وجود خطأ في الحقل
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // رسائل الخطأ المخصصة
  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (!field) return '';

    if (field.hasError('required')) {
      return 'هذا الحقل مطلوب';
    }

    if (field.hasError('email')) {
      return 'الإيميل غير صحيح';
    }

    if (field.hasError('emailMismatch')) {
      return 'الإيميل غير متطابق';
    }

    if (field.hasError('pattern')) {
      switch(fieldName) {
        case 'userName':
          return 'يُسمح فقط بحروف وأرقام و _';
        case 'firstName':
        case 'lastName':
          return 'يُسمح فقط بحروف (عربي أو إنجليزي)';
        case 'password':
          return 'يجب أن تحتوي على حرف كبير وصغير وارقام';
        case 'phoneNumber':
          return 'رقم موبايل صحيح (11 رقم)';
        default:
          return 'صيغة غير صحيحة';
      }
    }

    if (field.hasError('minlength')) {
      return 'كلمة السر على الأقل 6 ';
    }

    if (field.hasError('minAge')) {
      return 'يجب أن تكون سنك على الأقل 16 سنة';
    }

    return '';
  }

  submit() {
    // لو الفورم مش صحيح
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      // لو عاوز تظهر رسالة خطأ عامة
      alert('من فضلك تأكد من إدخال جميع البيانات بشكل صحيح');
      return;
    }

    // التحقق من تطابق الإيميل (مع أن الفاليديشن بيشيك بس احنا بنشيك تاني للأمان)
    if (this.registerForm.value.email !== this.registerForm.value.confirmEmail) {
      alert("Emails do not match ❌");
      return;
    }

    // لو كل حاجة تمام، نبعث البيانات
    this.auth.register(this.registerForm.value)
      .subscribe({
        next: () => {
          alert("Registered Successfully 🎉");
          this.router.navigate(['/login']);
        },
        error: err => {
          console.log(err);
          alert(err.error?.message || "Registration failed");
        }
      });
  }

}
