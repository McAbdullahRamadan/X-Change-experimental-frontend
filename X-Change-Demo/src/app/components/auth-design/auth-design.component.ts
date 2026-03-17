import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-design',
  standalone: false,
  templateUrl: './auth-design.component.html',
  styleUrl: './auth-design.component.css'
})
export class AuthDesignComponent {

  type:string="password";
  isText:boolean=false;
  eyeIcone:string="bi-eye-slash";
  hideShowPass(){
    this.isText=!this.isText;
    this.isText? this.eyeIcone="bi-eye" : this.eyeIcone="bi-eye-slash";
    this.isText?this.type="text" : this.type="password";
     }

}
