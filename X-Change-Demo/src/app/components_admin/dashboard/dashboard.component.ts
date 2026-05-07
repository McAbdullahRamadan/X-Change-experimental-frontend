import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent { isDark = false;
  isSidebarCollapsed = false;
  isMobileSidebarOpen = false;
  activePage = 'home';

  constructor(private router: Router) {
    const savedTheme = localStorage.getItem('theme');
    this.isDark = savedTheme === 'dark';

    // تحديد الصفحة النشطة من الرابط الحالي
    const currentUrl = this.router.url;
    if (currentUrl.includes('user-management')) this.activePage = 'user-management';
    else if (currentUrl.includes('educator-verification')) this.activePage = 'educator-verification';
    else if (currentUrl.includes('moderation')) this.activePage = 'moderation';
    else if (currentUrl.includes('course-management')) this.activePage = 'course-management';
    else if (currentUrl.includes('labor-exchange')) this.activePage = 'labor-exchange';
    else if (currentUrl.includes('corporate-partners')) this.activePage = 'corporate-partners';
    else if (currentUrl.includes('gamification')) this.activePage = 'gamification';
    else if (currentUrl.includes('audit-logs')) this.activePage = 'audit-logs';
    else this.activePage = 'home';
  }

  // ✅ دالة التنقل - تستخدم Router بدلاً من تغيير متغير
  navigateTo(page: string): void {
    this.activePage = page;

    if (page === 'home') {
      this.router.navigate(['/dashboard/home']);
    } else {
      this.router.navigate(['/dashboard', page]);
    }

    this.closeMobileSidebar();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  toggleDarkMode(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleSidebarMobile(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
    }
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  addNewCourse(): void {
    alert('Open add course modal');
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) {
      this.closeMobileSidebar();
    }
  }
}
