import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {

  // Flags for lazy loading
  isHeroVisible = false;
  isStatsVisible = false;
  isMasterSkillsVisible = false;
  isTestimonialsVisible = false;

  // لمتابعة العناصر المرئية
  private observer: IntersectionObserver | null = null;

  constructor(private animationService: AnimationService) {}

  ngOnInit(): void {
    this.setupLazyLoadObserver();
  }

  ngAfterViewInit(): void {
    // تهيئة Scroll Reveal بعد تحميل المكونات
    setTimeout(() => {
      this.animationService.initScrollReveal();
    }, 100);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.animationService.destroy();
  }

  private setupLazyLoadObserver(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const component = target.dataset['component'];

          switch(component) {
            case 'hero':
              this.isHeroVisible = true;
              break;
            case 'stats':
              this.isStatsVisible = true;
              break;
            case 'masterSkills':
              this.isMasterSkillsVisible = true;
              break;
            case 'testimonials':
              this.isTestimonialsVisible = true;
              break;
          }

          this.observer?.unobserve(target);

          // مراقبة العناصر الجديدة بعد التحميل
          setTimeout(() => {
            this.animationService.observeNewElements();
          }, 200);
        }
      });
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });

    const sections = document.querySelectorAll('[data-component]');
    sections.forEach(section => this.observer?.observe(section));
  }
}