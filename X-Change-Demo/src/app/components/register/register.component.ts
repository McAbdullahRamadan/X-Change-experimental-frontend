import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent  {
  registerForm!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required, Validators.email]],
      gender: [''],
      firstName: [''],
      lastName: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: [''],
      dateOfBirth: [''],
      city: [''],
      country: [''],
      nationalId: [''],
      university: [''],
      major: ['']
    });
  }



  submit() {
    debugger

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.registerForm.value.email !== this.registerForm.value.confirmEmail) {
      alert("Emails do not match ❌");
      return;
    }

    this.auth.registeruser(this.registerForm.value)
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
