import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent  {
  loginForm!:FormGroup;
  type:string="password";
  isText:boolean=false;
  eyeIcone:string="bi-eye-slash";
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit() {
    debugger
    if (this.loginForm.valid) {
      this.auth.login(this.loginForm.value)
        .subscribe({
          next: () => this.router.navigate(['']),
          error: err => alert(err.error)
        });
    }
  }
  hideShowPass(){
    this.isText=!this.isText;
    this.isText? this.eyeIcone="bi-eye" : this.eyeIcone="bi-eye-slash";
    this.isText?this.type="text" : this.type="password";
     }
}
