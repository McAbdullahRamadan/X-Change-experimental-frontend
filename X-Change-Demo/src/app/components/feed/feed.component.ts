import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FeedService } from '../../services/feed.service';
export interface Userfeed {
  name: string;
  handle: string;
  email: string;
  avatar: string;
  xp: number;
  level: number;
  followers: number;
  following: number;
  vibes: number;
}
@Component({
  selector: 'app-feed',
  standalone: false,
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit {
  user: Userfeed | null = null;
  activeIndex = 0;
  isScrolling = false;
  activeTab: 'forYou' | 'following' = 'forYou';
  isPanelCollapsed: boolean = false;

  togglePanel(): void {
    this.isPanelCollapsed = !this.isPanelCollapsed;

    // Optional: Save preference to localStorage
    localStorage.setItem('panelCollapsed', JSON.stringify(this.isPanelCollapsed));
  }


  @ViewChildren('vibeSlide') vibeSlides!: QueryList<ElementRef>;

  vibes = [
    {
      id: 1, username: 'karim.3d', handle: '@karim.3d', time: '2h ago',
      tag: 'DESIGN', emoji: '🎨', avatarClass: 'av1',
      bgClass: 'bg-v1', visualEmoji: '🌌',
      caption: 'شغلتي الجديدة في Figma — brand identity كاملة لـ startup مصرية 🔥',
      hashtags: ['#Figma', '#BrandIdentity', '#DesignEgypt'],
      likes: 2847, comments: 184, shares: 92, liked: false, saved: false, following: false
    },
    {
      id: 2, username: 'nour_dev', handle: '@nour_dev', time: '4h ago',
      tag: 'CODE', emoji: '💻', avatarClass: 'av2',
      bgClass: 'bg-v2', visualEmoji: '⚡',
      caption: 'بنيت API كاملة بـ 47 دقيقة بس باستخدام AI! الـ workflow دا غير حياتي كمطور 🚀',
      hashtags: ['#API', '#AITools', '#DevLife'],
      likes: 1923, comments: 241, shares: 156, liked: false, saved: false, following: false
    },
    {
      id: 3, username: 'dina.designz', handle: '@dina.designz', time: '6h ago',
      tag: 'VIBE', emoji: '✨', avatarClass: 'av3',
      bgClass: 'bg-v3', visualEmoji: '🎭',
      caption: 'Motion design tutorial جديد — اعمل animations زي دي في 10 دقائق فقط ✨',
      hashtags: ['#MotionDesign', '#Tutorial', '#Creative'],
      likes: 3102, comments: 298, shares: 204, liked: true, saved: false, following: true
    },
    {
      id: 4, username: 'aibuilder_eg', handle: '@aibuilder_eg', time: '8h ago',
      tag: 'AI', emoji: '🧠', avatarClass: 'av5',
      bgClass: 'bg-v4', visualEmoji: '🤖',
      caption: 'بنيت AI agent بيكتب كود بنفسه 😱 شوف الـ demo في الكومنتات',
      hashtags: ['#AI', '#Agent', '#BuildInPublic'],
      likes: 4201, comments: 512, shares: 340, liked: false, saved: false, following: false
    },
    {
      id: 5, username: 'mona.wav', handle: '@mona.wav', time: '10h ago',
      tag: 'MUSIC', emoji: '🎵', avatarClass: 'av4',
      bgClass: 'bg-v5', visualEmoji: '🎶',
      caption: 'صنعت beat كامل في 5 دقائق بـ Suno AI — دا مش cheating دا مهارة 🎵',
      hashtags: ['#Music', '#SunoAI', '#BeatMaker'],
      likes: 980, comments: 73, shares: 58, liked: false, saved: false, following: false
    },
    {
      id: 6, username: 'sama.ux', handle: '@sama.ux', time: '12h ago',
      tag: 'UX', emoji: '🚀', avatarClass: 'av4',
      bgClass: 'bg-v1', visualEmoji: '🎯',
      caption: 'UX case study لـ app مصري — من 0 لـ 50K user في 3 شهور، إزاي؟',
      hashtags: ['#UX', '#CaseStudy', '#Growth'],
      likes: 1560, comments: 120, shares: 89, liked: false, saved: false, following: false
    },
  ];

  constructor(private feedService: FeedService) {}

  ngOnInit() {
    this.feedService.user$.subscribe((u: Userfeed | null) => this.user = u);
    const savedState = localStorage.getItem('panelCollapsed');
    if (savedState) {
      this.isPanelCollapsed = JSON.parse(savedState);
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    event.preventDefault();
    if (this.isScrolling) return;
    if (event.deltaY > 30 && this.activeIndex < this.vibes.length - 1) {
      this.goToSlide(this.activeIndex + 1);
    } else if (event.deltaY < -30 && this.activeIndex > 0) {
      this.goToSlide(this.activeIndex - 1);
    }
  }

  private touchStartY = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    this.touchStartY = e.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(e: TouchEvent) {
    const delta = this.touchStartY - e.changedTouches[0].clientY;
    if (this.isScrolling) return;
    if (delta > 60 && this.activeIndex < this.vibes.length - 1) {
      this.goToSlide(this.activeIndex + 1);
    } else if (delta < -60 && this.activeIndex > 0) {
      this.goToSlide(this.activeIndex - 1);
    }
  }

  goToSlide(index: number) {
    this.isScrolling = true;
    this.activeIndex = index;
    setTimeout(() => this.isScrolling = false, 700);
  }

  toggleLike(vibe: any) { vibe.liked = !vibe.liked; vibe.likes += vibe.liked ? 1 : -1; }
  toggleSave(vibe: any) { vibe.saved = !vibe.saved; }
  toggleFollow(vibe: any) { vibe.following = !vibe.following; }
  setTab(tab: 'forYou' | 'following') { this.activeTab = tab; }

  formatNum(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }
}