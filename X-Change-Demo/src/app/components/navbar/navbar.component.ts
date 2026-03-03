import { Component, HostListener } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {


  isLoggedIn = false;
  showProfileMenu = false;

  constructor(private auth: AuthService){}

  isDark = false;

  ngOnInit(){
    const savedTheme = localStorage.getItem('theme');

    if(savedTheme === 'dark'){
      this.isDark = true;
      document.body.classList.add('dark-mode');
    }

  this.auth.isLoggedIn$.subscribe(status=>{
    this.isLoggedIn = status;
  });
  }

  toggleTheme(){

    this.isDark = !this.isDark;

    if(this.isDark){
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme','dark');
    }else{
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme','light');
    }
  }

  toggleProfile(){
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(){
    this.auth.logout();
    this.isLoggedIn = false;
    this.showProfileMenu = false;
  }

  @HostListener('document:click', ['$event'])
  closeMenu(event: any){
    if(!event.target.closest('.profile-container')){
      this.showProfileMenu = false;
    }
  }

  isMenuOpen = false;

  toggleMenu(){
    this.isMenuOpen = !this.isMenuOpen;
  }

  // تقفل لو الشاشة كبرت
  @HostListener('window:resize', [])
  onResize() {
    if (window.innerWidth > 768) {
      this.isMenuOpen = false;
    }
  }
}
