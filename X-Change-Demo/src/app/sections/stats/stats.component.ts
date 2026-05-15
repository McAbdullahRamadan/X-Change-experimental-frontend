import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-stats',
  standalone: false,
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent implements AfterViewInit, OnDestroy {

  @ViewChild('futureVideo') videoElement!: ElementRef<HTMLVideoElement>;

  private video: HTMLVideoElement | null = null;
  private controlBtn: HTMLElement | null = null;
  private isPlaying = true;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.initVideoPlayer();
    this.startCounters();
  }

  ngOnDestroy(): void {
    // تنظيف عند حذف المكون
    if (this.video) {
      this.video.pause();
      this.video = null;
    }
  }

  private initVideoPlayer(): void {
    this.video = this.videoElement?.nativeElement;
    if (!this.video) return;

    // إعدادات الفيديو
    this.video.muted = true;  // لازم يكون muted عشان autoplay يشتغل في معظم المتصفحات
    this.video.loop = true;   // تشغيل متكرر
    this.video.playsInline = true;  // للموبايل

    // محاولة تشغيل الفيديو تلقائياً
    const playPromise = this.video.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        // الفيديو اشتغل بنجاح
        this.isPlaying = true;
        this.updateButtonIcons(true);
      }).catch((error) => {
        // لو حصل مشكلة في التشغيل التلقائي
        console.log('Auto-play was prevented:', error);
        this.isPlaying = false;
        this.updateButtonIcons(false);
      });
    }

    // الحصول على زر التحكم
    this.controlBtn = document.getElementById('videoControlBtn');

    // إضافة حدث النقر على الزر
    if (this.controlBtn) {
      this.controlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleVideo();
      });
    }

    // إضافة حدث النقر على الفيديو نفسه
    this.video.addEventListener('click', () => {
      this.toggleVideo();
    });

    // لما الفيديو يخلص (في حالة الـ loop مش شغال)
    this.video.addEventListener('ended', () => {
      if (this.video && this.isPlaying && !this.video.loop) {
        this.video.play();
      }
    });
  }

  private toggleVideo(): void {
    if (!this.video) return;

    if (this.isPlaying) {
      // إيقاف الفيديو
      this.video.pause();
      this.isPlaying = false;
      this.updateButtonIcons(false);
    } else {
      // تشغيل الفيديو
      this.video.play().then(() => {
        this.isPlaying = true;
        this.updateButtonIcons(true);
      }).catch((error) => {
        console.log('Play failed:', error);
      });
    }
  }

  private updateButtonIcons(playing: boolean): void {
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');

    if (playIcon && pauseIcon) {
      if (playing) {
        (playIcon as HTMLElement).style.display = 'none';
        (pauseIcon as HTMLElement).style.display = 'flex';
      } else {
        (playIcon as HTMLElement).style.display = 'flex';
        (pauseIcon as HTMLElement).style.display = 'none';
      }
    }
  }

  private startCounters(): void {
    const counters = this.el.nativeElement.querySelectorAll('.counter');

    // استخدام Intersection Observer لبدء الكاونتر لما يظهر في الشاشة
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          counters.forEach((counter: HTMLElement) => {
            const target = +counter.getAttribute('data-target')!;
            this.animateCounter(counter, target);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    const statsSection = this.el.nativeElement.querySelector('.stats');
    if (statsSection) {
      observer.observe(statsSection);
    } else {
      // لو مش لاقي القسم يشتغل مباشرة
      counters.forEach((counter: HTMLElement) => {
        const target = +counter.getAttribute('data-target')!;
        this.animateCounter(counter, target);
      });
    }
  }

  private animateCounter(element: HTMLElement, target: number): void {
    let count = 0;
    const increment = target / 80; // تقسيم أكثر سلاسة

    const update = () => {
      count += increment;
      if (count < target) {
        element.innerText = Math.floor(count).toString();
        requestAnimationFrame(update);
      } else {
        element.innerText = target + (target === 50 ? 'K' : '+');
      }
    };

    update();
  }
}