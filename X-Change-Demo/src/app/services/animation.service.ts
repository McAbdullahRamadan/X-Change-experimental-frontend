import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
export interface AnimationConfig {
  animation: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'zoomIn' | 'scale';
  delay?: number;
  duration?: number;
}
@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private observer: IntersectionObserver | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * تهيئة مراقبة العناصر لإضافة الأنيميشن عند ظهورها
   */
  initScrollReveal(): void {
    if (!this.isBrowser) return;

    // إعدادات Intersection Observer
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const animation = element.dataset['animation'] || 'fadeUp';
          const delay = element.dataset['delay'] || '0';
          const duration = element.dataset['duration'] || '0.6';

          // إضافة كلاس الأنيميشن
          element.style.animation = `${animation} ${duration}s ease forwards`;
          element.style.animationDelay = `${delay}s`;
          element.classList.add('animated');

          // إلغاء المراقبة بعد التشغيل
          this.observer?.unobserve(element);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    // مراقبة جميع العناصر التي تحمل كلاس animate-on-scroll
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => this.observer?.observe(el));
  }

  /**
   * إضافة العناصر الجديدة للمراقبة (بعد التحميل الديناميكي)
   */
  observeNewElements(): void {
    if (!this.isBrowser || !this.observer) return;

    const elements = document.querySelectorAll('.animate-on-scroll:not(.observed)');
    elements.forEach(el => {
      el.classList.add('observed');
      this.observer?.observe(el);
    });
  }

  /**
   * تنظيف المراقب
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}