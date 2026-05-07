import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-join',
  standalone: false,
  templateUrl: './join.component.html',
  styleUrl: './join.component.css'
})
export class JoinComponent implements AfterViewInit, OnDestroy {
  private observers: IntersectionObserver[] = [];

  constructor(
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngAfterViewInit(): void {
    this.setupLazyLoading();
  }

  private setupLazyLoading(): void {
    // Hero section
    const hero = this.el.nativeElement.querySelector('.join-hero');
    if (hero) {
      this.observeElement(hero, 'hero');
    }

    // Stats section (لو موجود)
    const stats = this.el.nativeElement.querySelector('.stats-section');
    if (stats) {
      this.observeElement(stats, 'stats');
    }
  }

  private observeElement(element: HTMLElement, name: string): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.renderer.addClass(entry.target, 'visible');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(element);
    this.observers.push(observer);
  }

  joinSquad(): void {
    console.log('Join Squad clicked');
    // اضافة منطق التسجيل هنا
  }

  watchDemo(): void {
    console.log('Watch Demo clicked');
    // اضافة منطق مشاهدة الديمو هنا
  }

  ngOnDestroy(): void {
    this.observers.forEach(observer => observer.disconnect());
  }
}