import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-master-skills',
  standalone: false,
  templateUrl: './master-skills.component.html',
  styleUrl: './master-skills.component.css'
})
export class MasterSkillsComponent implements AfterViewInit, OnDestroy {
  private observers: IntersectionObserver[] = [];

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngAfterViewInit(): void {
    this.setupLazyLoading();
  }

  private setupLazyLoading(): void {
    // Hero Section
    const hero = this.el.nativeElement.querySelector('.master-hero');
    if (hero) {
      this.observeElement(hero);
    }

    // Skills Section
    const skillsSection = this.el.nativeElement.querySelector('.skills-section');
    if (skillsSection) {
      this.observeElement(skillsSection);
    }

    // CTA Section
    const cta = this.el.nativeElement.querySelector('.cta-section');
    if (cta) {
      this.observeElement(cta);
    }

    // كل Skill Card على حدة
    const cards = this.el.nativeElement.querySelectorAll('.skill-card');
    cards.forEach((card: HTMLElement, index: number) => {
      this.observeCard(card, index);
    });
  }

  private observeElement(element: HTMLElement): void {
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

  private observeCard(card: HTMLElement, index: number): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              this.renderer.addClass(entry.target, 'card-visible');
            }, index * 80);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(card);
    this.observers.push(observer);
  }

  navigateToCourses(category: string): void {
    this.router.navigate(['/courses'], {
      queryParams: { category: category }
    });
  }

  ngOnDestroy(): void {
    this.observers.forEach(observer => observer.disconnect());
  }
}