import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
export interface Attachment {
  type: 'image' | 'file';
  name: string;
  preview?: string;   // base64 — images only
  ext?: string;       // e.g. PDF, DOCX — files only
  size?: string;      // e.g. "142 KB"
}

export interface Post {
  id: number;
  authorInitials: string;
  authorName: string;
  avatarGradient: string;
  timeAgo: string;
  badge?: { label: string; type: 'trending' | 'new-badge' | 'pinned-badge' };
  title: string;
  excerpt: string;
  tags: string[];
  likes: number;
  comments: number;
  views: string;
}
@Component({
  selector: 'app-usercommunity',
  standalone: false,
  templateUrl: './usercommunity.component.html',
  styleUrl: './usercommunity.component.css'
})
export class UsercommunityComponent implements OnInit {

  /* ── ViewChild refs ─────────────────────────────────────── */
  @ViewChild('composerTextarea') composerTextareaRef!: ElementRef<HTMLTextAreaElement>;

  /* ══════════════════════════════════════════════════════════
     COMPOSER STATE
     ══════════════════════════════════════════════════════════ */

  readonly MAX_CHARS = 500;

  postText       = '';
  audienceOption = '🌐 Public';
  showLinkInput  = false;
  linkUrl        = '';
  attachments: Attachment[] = [];

  get charCount(): number { return this.postText.length; }
  get charOverLimit(): boolean { return this.charCount > this.MAX_CHARS; }

  audienceOptions = ['🌐 Public', '👥 Followers', '🔒 Private'];

  /* ── On paste — detect clipboard images ───────────────── */
  onComposerPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) this.readImageFile(file);
      }
    }
  }

  /* ── Image upload from file picker ───────────────────── */
  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => this.readImageFile(file));
    input.value = ''; // reset so same file can be re-uploaded
  }

  private readImageFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.attachments.push({
        type: 'image',
        name: file.name,
        preview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  /* ── File upload from file picker ────────────────────── */
  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      const ext  = file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
      const size = (file.size / 1024).toFixed(0) + ' KB';

      this.attachments.push({
        type: 'file',
        name: this.shortenName(file.name),
        ext,
        size,
      });
    });

    input.value = '';
  }

  /* ── Remove attachment ────────────────────────────────── */
  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  /* ── Link panel ───────────────────────────────────────── */
  toggleLinkInput(): void {
    this.showLinkInput = !this.showLinkInput;
    if (!this.showLinkInput) this.linkUrl = '';
  }

  addLink(): void {
    const url = this.linkUrl.trim();
    if (!url) return;

    this.postText = this.postText
      ? this.postText + '\n' + url
      : url;

    this.linkUrl       = '';
    this.showLinkInput = false;
  }

  cancelLink(): void {
    this.showLinkInput = false;
    this.linkUrl       = '';
  }

  /* ── Submit post ──────────────────────────────────────── */
  submitPost(): void {
    if (!this.postText.trim() && !this.attachments.length) return;
    if (this.charOverLimit) return;

    // TODO: wire to your PostService / API call
    console.log('Submitting post:', {
      text        : this.postText,
      audience    : this.audienceOption,
      attachments : this.attachments,
    });

    // Reset form
    this.postText    = '';
    this.attachments = [];
    this.linkUrl     = '';
    this.showLinkInput = false;
  }

  /* ── Helper ───────────────────────────────────────────── */
  shortenName(name: string, max = 22): string {
    return name.length > max ? name.substring(0, max - 3) + '...' : name;
  }

  /* ══════════════════════════════════════════════════════════
     FEED TABS
     ══════════════════════════════════════════════════════════ */

  tabs = ['Latest', 'Popular', 'Following'];
  activeTab = 'Latest';

  setTab(tab: string): void {
    this.activeTab = tab;
    // TODO: call your service to load posts for this tab
  }

  /* ══════════════════════════════════════════════════════════
     POSTS DATA
     ══════════════════════════════════════════════════════════ */

  posts: Post[] = [
    {
      id: 1,
      authorInitials : 'AR',
      authorName     : 'Abdullah',
      avatarGradient : 'linear-gradient(135deg,#3d5afe,#00f5d4)',
      timeAgo        : '2 hours ago',
      badge          : { label: '🔥 Trending', type: 'trending' },
      title          : 'How I learned Angular in 30 days (and you can too!)',
      excerpt        : 'After 6 months of struggling, I finally found a learning path that works. Here\'s my complete roadmap with resources, tips, and the mistakes to avoid...',
      tags           : ['#Angular', '#WebDev', '#Learning'],
      likes          : 234,
      comments       : 45,
      views          : '1.2k',
    },
    {
      id: 2,
      authorInitials : 'R',
      authorName     : 'Roqaya',
      avatarGradient : 'linear-gradient(135deg,#ff6b35,#bf5af2)',
      timeAgo        : '5 hours ago',
      badge          : { label: '✦ New', type: 'new-badge' },
      title          : 'Looking for a UI/UX mentor — willing to swap Python skills',
      excerpt        : 'I\'m a backend developer wanting to learn UI/UX. Happy to teach Python/Django in exchange. Anyone interested in a skill-swap collaboration?',
      tags           : ['#Mentorship', '#SkillSwap', '#UIUX'],
      likes          : 89,
      comments       : 23,
      views          : '567',
    },
    {
      id: 3,
      authorInitials : 'L',
      authorName     : 'Loaa',
      avatarGradient : 'linear-gradient(135deg,#22c55e,#00f5d4)',
      timeAgo        : '1 day ago',
      badge          : { label: '📌 Pinned', type: 'pinned-badge' },
      title          : 'Community Resources Megathread — Free courses, tools & roadmaps',
      excerpt        : 'A curated list of the best free resources for web dev, AI/ML, design, and career growth. Updated weekly by the community...',
      tags           : ['#Resources', '#FreeStuff', '#Roadmap'],
      likes          : 521,
      comments       : 112,
      views          : '4.8k',
    },
  ];

  likePost(post: Post): void {
    post.likes++;
    // TODO: wire to API
  }

  loadMorePosts(): void {
    // TODO: call your PostService.loadMore()
    console.log('Loading more posts...');
  }

  /* ══════════════════════════════════════════════════════════
     TRENDING TOPICS
     ══════════════════════════════════════════════════════════ */

  topics = [
    { name: 'Angular',      count: 342, barWidth: '100%' },
    { name: 'AI & ML',      count: 287, barWidth: '83%'  },
    { name: 'UI/UX',        count: 156, barWidth: '45%'  },
    { name: 'CareerAdvice', count: 98,  barWidth: '28%'  },
  ];

  selectTopic(topic: { name: string }): void {
    console.log('Selected topic:', topic.name);
    // TODO: filter feed by topic
  }

  /* ══════════════════════════════════════════════════════════
     TOP CONTRIBUTORS
     ══════════════════════════════════════════════════════════ */

  contributors = [
    { initials: 'SA', name: 'Loaa  Eid',  points: '1,200', gradient: 'linear-gradient(135deg,#ff3cac,#ff6b35)', rank: '🥇 #1', rankClass: 'gold'   },
    { initials: 'KN', name: 'Abdullah Ramadan ',points: '892',   gradient: 'linear-gradient(135deg,#00f5d4,#3d5afe)', rank: '🥈 #2', rankClass: 'silver' },
    { initials: 'NQ', name: 'Roqaya Ammar',   points: '654',   gradient: 'linear-gradient(135deg,#bf5af2,#ff3cac)', rank: '🥉 #3', rankClass: 'bronze' },
  ];

  /* ══════════════════════════════════════════════════════════
     ONLINE USERS
     ══════════════════════════════════════════════════════════ */

  onlineUsers = [
    { initials: 'SA', bg: '#ff3cac',             color: '#fff'    },
    { initials: 'KN', bg: '#00f5d4',             color: '#0d0d0f' },
    { initials: 'NQ', bg: '#bf5af2',             color: '#fff'    },
    { initials: 'MA', bg: '#ff6b35',             color: '#fff'    },
    { initials: 'LT', bg: '#3d5afe',             color: '#fff'    },
  ];

  onlineCount = 247;

  /* ══════════════════════════════════════════════════════════
     UPCOMING EVENTS
     ══════════════════════════════════════════════════════════ */

  events = [
    { day: '15', month: 'APR', title: 'Live Q&A: Angular Signals',  meta: '⏱ 2:00 PM · Online'        },
    { day: '18', month: 'APR', title: 'Skill Swap Meetup (Cairo)',   meta: '📍 Hybrid · Limited seats'  },
    { day: '22', month: 'APR', title: 'AI for Beginners Workshop',   meta: '🎥 Online · Free'            },
  ];

  registerEvent(event: { title: string }): void {
    console.log('Registering for:', event.title);
    // TODO: open registration modal / navigate
  }

  /* ══════════════════════════════════════════════════════════
     COMMUNITY GUIDELINES
     ══════════════════════════════════════════════════════════ */

  guidelines = [
    'Be respectful and kind',
    'No spam or self-promotion',
    'Help others learn',
    'Give constructive feedback',
  ];

  /* ══════════════════════════════════════════════════════════
     PROGRESS
     ══════════════════════════════════════════════════════════ */

  progressPercent = 65;

  /* ══════════════════════════════════════════════════════════
     LIFECYCLE
     ══════════════════════════════════════════════════════════ */

  ngOnInit(): void {
    // TODO: load posts, topics, events from services
  }
}
