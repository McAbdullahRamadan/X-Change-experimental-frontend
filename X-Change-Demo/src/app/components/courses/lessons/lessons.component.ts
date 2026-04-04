import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ChatMessage {
  id: number;
  sender: 'instructor' | 'user';
  text: string;
  time: string;
}
export interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
}
@Component({
  selector: 'app-lessons',
  standalone: false,
  templateUrl: './lessons.component.html',
  styleUrl: './lessons.component.css'
})
export class LessonsComponent implements OnInit, OnDestroy {

  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatBody') chatBodyRef!: ElementRef<HTMLDivElement>;

  // ── Course data ────────────────────────────────────────────────────────
  courseTitle   = 'ASP.NET Core & Angular';

  courseSubtitle = 'Full-Stack Web Development';

    lessons: Lesson[] = [
    { id: 1, title: 'Introduction & Setup',        duration: '12:30', completed: true  },
    { id: 2, title: 'Angular Components Basics',   duration: '18:45', completed: false },
    { id: 3, title: 'Services & Dependency Inject', duration: '22:10', completed: false },
    { id: 4, title: 'ASP.NET Core API Setup',      duration: '25:00', completed: false },
    { id: 5, title: 'Entity Framework Core',       duration: '30:15', completed: false },
    { id: 6, title: 'Authentication & JWT',        duration: '28:50', completed: false },
  ];

  activeLesson: Lesson = this.lessons[1];

  // ── Video player state ─────────────────────────────────────────────────
  isPlaying    = false;
  isMuted      = false;
  progress     = 34;          // percent
  currentTime  = '06:22';
  totalTime    = '18:45';
  volume       = 80;
  isFullscreen = false;

  // ── Notes / Transcript ─────────────────────────────────────────────────
  activeTab: 'transcript' | 'notes' = 'transcript';
  notesText = '';

  transcriptLines = [
    { time: '00:00', text: 'Welcome to this lesson on Angular Components.' },
    { time: '01:12', text: 'In this lesson we will build reusable UI components.' },
    { time: '02:45', text: 'A component consists of a TypeScript class, an HTML template, and a CSS file.' },
    { time: '04:10', text: 'Let\'s start by generating a new component using the Angular CLI.' },
    { time: '06:22', text: 'Here we see the @Component decorator with its selector and templateUrl.' },
  ];

  // ── Live chat ──────────────────────────────────────────────────────────
  chatInput = '';
  chatMessages: ChatMessage[] = [
    { id: 1, sender: 'instructor', text: 'Welcome everyone! Feel free to ask questions as we go.', time: '10:02' },
    { id: 2, sender: 'user',       text: 'Can you explain the difference between standalone and module-based?', time: '10:05' },
    { id: 3, sender: 'instructor', text: 'Great question! Standalone components don\'t need NgModule. We\'ll cover this in lesson 3.', time: '10:06' },
  ];

  private _msgId = 4;
  private _progressInterval: any;

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Simulate video progress ticking when playing
  }

  ngOnDestroy(): void {
    if (this._progressInterval) clearInterval(this._progressInterval);
  }

  // ── Lesson selection ───────────────────────────────────────────────────
  selectLesson(lesson: Lesson): void {
    this.activeLesson = lesson;
    this.isPlaying = false;
    this.progress  = 0;
    this.currentTime = '00:00';
    this.totalTime   = lesson.duration;
    if (this._progressInterval) clearInterval(this._progressInterval);
  }

  // ── Player controls ────────────────────────────────────────────────────
  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this._progressInterval = setInterval(() => {
        if (this.progress < 100) {
          this.progress += 0.2;
          this._updateTime();
        } else {
          this.isPlaying = false;
          clearInterval(this._progressInterval);
        }
      }, 100);
    } else {
      clearInterval(this._progressInterval);
    }
  }

  toggleMute(): void { this.isMuted = !this.isMuted; }

  seek(event: MouseEvent): void {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    this.progress = Math.max(0, Math.min(100,
      ((event.clientX - rect.left) / rect.width) * 100
    ));
    this._updateTime();
  }

  private _updateTime(): void {
    const total = this._parseDuration(this.activeLesson.duration);
    const current = (this.progress / 100) * total;
    this.currentTime = this._formatDuration(current);
  }

  private _parseDuration(d: string): number {
    const [m, s] = d.split(':').map(Number);
    return m * 60 + s;
  }

  private _formatDuration(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  toggleFullscreen(): void { this.isFullscreen = !this.isFullscreen; }

  // ── Chat ───────────────────────────────────────────────────────────────
  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text) return;

    this.chatMessages.push({
      id: this._msgId++,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
    this.chatInput = '';

    // Simulate instructor reply
    setTimeout(() => {
      this.chatMessages.push({
        id: this._msgId++,
        sender: 'instructor',
        text: 'Thanks for your question! I\'ll address this shortly.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
      setTimeout(() => this._scrollChat(), 50);
    }, 1200);

    setTimeout(() => this._scrollChat(), 50);
  }

  onChatKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private _scrollChat(): void {
    if (this.chatBodyRef?.nativeElement) {
      this.chatBodyRef.nativeElement.scrollTop =
        this.chatBodyRef.nativeElement.scrollHeight;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  completedCount(): number {
    return this.lessons.filter(l => l.completed).length;
  }

  overallProgress(): number {
    return Math.round((this.completedCount() / this.lessons.length) * 100);
  }
}
