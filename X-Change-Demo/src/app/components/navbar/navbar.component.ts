import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PhotoService } from '../../services/photo.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  showProfileMenu = false;
  isDark = false;
  isLoggedIn = false;

  // ✅ خصائص جديدة للصورة والاسم
  profileImageUrl: string = 'default user.png';
  firstName: string = '';
  lastName: string = '';
  userName: string = '';

  constructor(
    public authService: AuthService,
    private photoService: PhotoService,
    private userService: UserService, // ✅ أضف ده
    private router: Router
  ) {}

  ngOnInit(): void {
    // التحقق من حالة تسجيل الدخول
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        this.loadUserProfileImage(); // ✅ حمل الصورة
        this.loadUserData(); // ✅ حمل بيانات المستخدم
      } else {
        this.showProfileMenu = false;
        this.profileImageUrl = 'default user.png';
        this.firstName = '';
        this.lastName = '';
        this.userName = '';
      }
    });

    // التحقق من الوضع المحفوظ في localStorage
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      this.isDark = true;
      document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
      this.isDark = false;
      document.body.classList.remove('dark-mode');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark = prefersDark;
      if (prefersDark) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
    }
  }

  // ✅ دالة جديدة لتحميل بيانات المستخدم (الاسم الحقيقي)
  loadUserData(): void {
    const userId = this.authService.getUserIdFromToken();

    if (userId) {
      this.userService.getUserById(userId).subscribe({
        next: (response: any) => {
          if (response?.isSuccess && response?.data) {
            const userData = this.userService.mapUserData(response.data);
            if (userData) {
              this.firstName = userData.firstname || '';
              this.lastName = userData.lastname || '';
              this.userName = userData.userName || '';
            }
          }
        },
        error: (err) => {
          console.error('Error loading user data:', err);
          // استخدام username من التوكت كـ fallback
          this.userName = this.authService.getUsernameFromToken() || '';
        }
      });
    }
  }

  // ✅ دالة لتحميل الصورة الشخصية
  loadUserProfileImage(): void {
    const userId = this.authService.getUserIdFromToken();

    if (userId) {
      this.photoService.getUserPhotos(userId, 1).subscribe({
        next: (response) => {
          if (response?.isSuccess && response?.data) {
            const currentPhoto = response.data.find((p: any) => p.isCurrent);
            if (currentPhoto) {
              this.profileImageUrl = currentPhoto.photoUrl;
            }
          }
        },
        error: (err) => {
          console.error('Error loading profile image:', err);
          this.profileImageUrl = 'default user.png';
        }
      });
    }
  }

  // ✅ دالة مساعدة لعرض الاسم الكامل
  get displayName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    } else if (this.firstName) {
      return this.firstName;
    } else if (this.lastName) {
      return this.lastName;
    } else if (this.userName) {
      return this.userName;
    }
    return 'User';
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleProfile(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;

    if (this.isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      console.log('Dark mode enabled');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      console.log('Light mode enabled');
    }
  }

  getProfileLink(): string {
    const username = this.authService.getUsernameFromToken();
    return username ? `/profile/${username}` : '/profile';
  }

  logout(): void {
    this.authService.logout();
    this.showProfileMenu = false;
    this.router.navigate(['/']);
  }
}