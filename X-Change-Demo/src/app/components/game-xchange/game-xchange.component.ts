import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener,
  NgZone, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import * as THREE from 'three';
/* ───────────────────────────────────────
   TYPES
─────────────────────────────────────── */

interface Box2D { x0: number; x1: number; z0: number; z1: number; }

interface Lesson {
  id: number;
  title: string;
  icon: string;
  duration: string;
  content: string[];
  quiz?: { q: string; options: string[]; answer: number };
}

interface LearningBuilding {
  id: string;
  label: string;
  field: string;
  color: number;
  signColor: number;
  x: number; z: number;
  icon: string;
  lessons: Lesson[];
}
interface ScreenOrientationWithLock extends ScreenOrientation {
  lock(orientation: string): Promise<void>;
}

interface Npc {
  mesh: THREE.Group;
  name: string;
  speed: number;
  dir: THREE.Vector3;
  wc: number;
  bones: NpcBones;
}

interface NpcBones {
  lLeg: THREE.Object3D; rLeg: THREE.Object3D;
  lArm: THREE.Object3D; rArm: THREE.Object3D;
}

interface PlayerBones {
  lLeg: THREE.Object3D; rLeg: THREE.Object3D;
  lArm: THREE.Object3D; rArm: THREE.Object3D;
  lFArm: THREE.Object3D; rFArm: THREE.Object3D;
  body: THREE.Object3D; head: THREE.Object3D;
}

@Component({
  selector: 'app-game-xchange',
  standalone: false,
  templateUrl: './game-xchange.component.html',
  styleUrl: './game-xchange.component.css'
})
export class GameXChangeComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mmCanvas', { static: true }) mmRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mmDisplay', { static: false }) mmDispRef?: ElementRef<HTMLCanvasElement>;

  /* ── UI state ── */
  showSplash = true;
  showNameForm = false;
  isPaused = false;
  showCtrl = false;
  notif: string | null = null;
  nearNpc: Npc | null = null;

  // Player name
  playerName = '';
  nameError = '';
  isMobile = false;
  mobileJoystickActive = false;
  mobileJoystickVector = { x: 0, y: 0 };
  mobileRunActive = false;
  private joystickBase: HTMLElement | null = null;
  private joystickThumb: HTMLElement | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private joystickRadius = 0;

  // Learning system
  showLesson = false;
  activeBldg: LearningBuilding | null = null;
  activeLesson: Lesson | null = null;
  lessonIndex = 0;
  lessonCompleted = false;
  quizAnswered = -1;
  quizCorrect = false;
  completedLessons = new Set<string>();

  // Near building detection
  nearBldg: LearningBuilding | null = null;

  timeOfDay = 14; isDaytime = true;
  timeStr = '14:00'; todTxt = 'AFTERNOON'; sunIco = '☀';

  spd = 0; money = 15000; hp = 100;
  cx = 0; cz = 0; locName = 'City Center Plaza';
  sens = 0.10;
  fpsVal = 60;
  quality = 'Auto';
  showMobileControls = false;
private performanceMode = false;
private frameSkip = 1;
private frameCounter = 0;

  /* ── Three.js ── */
  private scene!: THREE.Scene;
  private cam!: THREE.PerspectiveCamera;
  private rdr!: THREE.WebGLRenderer;
  private mmCtx!: CanvasRenderingContext2D;

  private player!: THREE.Group;
  private pBones!: PlayerBones;
  private boxes: Box2D[] = [];
  private treebox: Box2D[] = [];
  private npcs: Npc[] = [];

  private sun!: THREE.DirectionalLight;
  private moon!: THREE.DirectionalLight;
  private amb!: THREE.AmbientLight;
  private hemi!: THREE.HemisphereLight;

  private lampLights: THREE.PointLight[] = [];
  private lampMats: THREE.MeshLambertMaterial[] = [];
  private neonLights: THREE.PointLight[] = [];
  private neonMats: THREE.MeshLambertMaterial[] = [];
  private stars!: THREE.Points;
  private sky = new THREE.Color(0x87CEEB);

  /* ── Input ── */
  private keys = new Set<string>();
  private yaw = 0;
  private pitch = 0;
  private locked = false;

  /* ── Camera spring ── */
  private cx_ = 0; private cy_ = 4; private cz_ = 8;
  private readonly CAM_D = 6.5;
  private readonly CAM_H = 2.6;
  private readonly CAM_SP = 0.09;

  /* ── Movement ── */
  private wc = 0;
  private jumping = false; private jumpV = 0;
  private camMode = 0;

  /* ── Frame ── */
  private aid: number | null = null;
  private fr = 0;
  private fpsN = 0; private fpsT = 0;
  private hudN = 0;
  private npcT = 0;
  private notifT: any = null;
  private lastT = 0;

  /* ── Shared ── */
  private mc = new Map<number, THREE.MeshLambertMaterial>();
  private du = new THREE.Object3D();
  readonly W = 300;

  private readonly ZONES = [
    { x0: -150, x1: -20, z0: -150, z1: -20, n: 'Financial District' },
    { x0: -20, x1: 20, z0: -150, z1: -20, n: 'North Avenue' },
    { x0: 20, x1: 150, z0: -150, z1: -20, n: 'Tech Hub' },
    { x0: -150, x1: -20, z0: -20, z1: 20, n: 'Old Town' },
    { x0: -20, x1: 20, z0: -20, z1: 20, n: 'City Center Plaza' },
    { x0: 20, x1: 150, z0: -20, z1: 20, n: 'Shopping District' },
    { x0: -150, x1: -20, z0: 20, z1: 150, n: 'Green Park' },
    { x0: -20, x1: 20, z0: 20, z1: 150, n: 'South Residential' },
    { x0: 20, x1: 150, z0: 20, z1: 150, n: 'Industrial Zone' },
  ];

  /* ── Learning Buildings ── */
  readonly LEARN_BLDGS: LearningBuilding[] = [
    {
      id: 'finance', label: 'FINANCE', field: 'Financial Skills', icon: '💰',
      color: 0x1a3a6e, signColor: 0x00aaff, x: -38, z: -50,
      lessons: [
        {
          id: 1, title: 'What is Money?', icon: '💵', duration: '3 min',
          content: [
            'Money is a medium of exchange that allows people to trade goods and services without bartering.',
            'Throughout history, people used gold, silver, shells, and other items as money. Today we use paper currency and digital payments.',
            'Money has three main functions: Medium of Exchange, Store of Value, and Unit of Account.',
            'Understanding money is the first step to financial freedom!'
          ],
          quiz: { q: 'What are the three main functions of money?', options: ['Save, Spend, Invest', 'Exchange, Store, Account', 'Earn, Borrow, Pay', 'None of these'], answer: 1 }
        },
        {
          id: 2, title: 'Budgeting Basics', icon: '📊', duration: '4 min',
          content: [
            'A budget is a plan for how you will spend your money each month. It helps you live within your means.',
            'The 50/30/20 rule: 50% on needs (rent, food), 30% on wants (entertainment), 20% on savings.',
            'Track every expense for one month. You will be surprised where your money goes!',
            'Apps like Mint, YNAB, or even a simple spreadsheet can help you budget effectively.'
          ],
          quiz: { q: 'In the 50/30/20 rule, what % goes to savings?', options: ['10%', '30%', '20%', '50%'], answer: 2 }
        },
        {
          id: 3, title: 'Saving & Emergency Fund', icon: '🏦', duration: '4 min',
          content: [
            'An emergency fund is 3–6 months of expenses saved for unexpected events like job loss or medical bills.',
            'Start small — even saving $50 per month builds a habit. Consistency beats large one-time deposits.',
            'Keep your emergency fund in a separate high-yield savings account, not your everyday account.',
            'Once your emergency fund is full, redirect that money to investments!'
          ],
          quiz: { q: 'How many months of expenses should an emergency fund cover?', options: ['1 month', '3–6 months', '10 months', '1 year'], answer: 1 }
        },
        {
          id: 4, title: 'Introduction to Investing', icon: '📈', duration: '5 min',
          content: [
            'Investing means putting your money to work so it grows over time. The stock market averages ~10% return per year historically.',
            'Compound interest is the 8th wonder of the world. $1,000 invested at 10% for 30 years becomes over $17,000!',
            'Diversification: Don\'t put all eggs in one basket. Spread investments across stocks, bonds, and real estate.',
            'Start investing early — time in the market beats timing the market every single time.'
          ],
          quiz: { q: 'What does diversification mean?', options: ['Investing in one stock', 'Spreading investments to reduce risk', 'Saving in a bank only', 'Spending more money'], answer: 1 }
        }
      ]
    },
    {
      id: 'coding', label: 'CODING', field: 'Programming & Tech', icon: '💻',
      color: 0x0a2a1a, signColor: 0x00ff88, x: 40, z: -50,
      lessons: [
        {
          id: 1, title: 'What is Programming?', icon: '🖥️', duration: '3 min',
          content: [
            'Programming is giving instructions to a computer to solve problems. It\'s like writing a recipe for a machine.',
            'Programs are written in programming languages like Python, JavaScript, Java, and C++.',
            'Every app on your phone, every website you visit — all built by programmers!',
            'You don\'t need to be a math genius to code. Logical thinking is more important.'
          ],
          quiz: { q: 'What is programming?', options: ['Drawing on a computer', 'Giving instructions to a computer', 'Playing video games', 'Fixing hardware'], answer: 1 }
        },
        {
          id: 2, title: 'Variables & Data Types', icon: '📦', duration: '4 min',
          content: [
            'A variable is a container that stores data. Think of it as a labeled box holding information.',
            'Main data types: Numbers (42, 3.14), Text/Strings ("Hello"), Booleans (true/false), Arrays ([1,2,3]).',
            'Example: let age = 25; let name = "Ahmed"; let isStudent = true;',
            'Good variable names are descriptive: "userAge" is better than just "x".'
          ],
          quiz: { q: 'What is a variable in programming?', options: ['A type of bug', 'A container that stores data', 'A programming language', 'A website'], answer: 1 }
        },
        {
          id: 3, title: 'Loops & Conditions', icon: '🔄', duration: '4 min',
          content: [
            'Conditions (if/else) let your program make decisions: if (score > 90) { grade = "A"; }',
            'Loops repeat code: for (let i = 0; i < 10; i++) — runs the block 10 times.',
            'While loops run until a condition is false: while (lives > 0) { playGame(); }',
            'These two concepts — conditions and loops — are the backbone of all programming logic!'
          ],
          quiz: { q: 'What does a loop do?', options: ['Stops the program', 'Connects to internet', 'Repeats code multiple times', 'Stores data'], answer: 2 }
        },
        {
          id: 4, title: 'Web Development Basics', icon: '🌐', duration: '5 min',
          content: [
            'The web is built on 3 technologies: HTML (structure), CSS (style), JavaScript (behavior).',
            'HTML: <h1>Hello World</h1> — creates headings, paragraphs, images, and links.',
            'CSS: h1 { color: blue; font-size: 24px; } — makes things look beautiful.',
            'JavaScript: document.getElementById("btn").onclick = () => alert("Clicked!") — adds interactivity.'
          ],
          quiz: { q: 'Which language makes a website interactive?', options: ['HTML', 'CSS', 'JavaScript', 'SQL'], answer: 2 }
        }
      ]
    },
    {
      id: 'business', label: 'BUSINESS', field: 'Entrepreneurship', icon: '🏢',
      color: 0x3a2010, signColor: 0xff8800, x: -3, z: -80,
      lessons: [
        {
          id: 1, title: 'What is a Business?', icon: '🏪', duration: '3 min',
          content: [
            'A business is an organization that sells products or services to make a profit.',
            'Businesses come in all sizes: sole traders (one person), small businesses, and large corporations.',
            'The key to a business is solving a problem or fulfilling a need for customers.',
            'Every great business started with a simple idea. Apple started in a garage!'
          ],
          quiz: { q: 'What is the key to a successful business?', options: ['Having a big office', 'Solving a problem for customers', 'Spending a lot of money', 'Having many employees'], answer: 1 }
        },
        {
          id: 2, title: 'Business Plan Essentials', icon: '📋', duration: '4 min',
          content: [
            'A business plan is your roadmap. It describes what your business does and how it will succeed.',
            'Key sections: Executive Summary, Market Analysis, Products/Services, Marketing Plan, Financial Projections.',
            'Know your target market — who are your customers? What do they need? How much will they pay?',
            'A good plan doesn\'t guarantee success, but no plan almost guarantees failure.'
          ],
          quiz: { q: 'What is a business plan?', options: ['A financial statement', 'A roadmap for your business', 'A marketing advertisement', 'A legal contract'], answer: 1 }
        },
        {
          id: 3, title: 'Marketing Fundamentals', icon: '📢', duration: '4 min',
          content: [
            'Marketing is how you communicate the value of your product to potential customers.',
            'The 4 P\'s of Marketing: Product (what you sell), Price (what you charge), Place (where you sell), Promotion (how you advertise).',
            'Digital marketing: Social media, SEO, email marketing, and paid ads are key modern channels.',
            'Your brand is your reputation. Build it with consistency, quality, and great customer service.'
          ],
          quiz: { q: 'What are the 4 P\'s of Marketing?', options: ['Plan, Profit, People, Place', 'Product, Price, Place, Promotion', 'Produce, Perform, Publish, Profit', 'None of these'], answer: 1 }
        },
        {
          id: 4, title: 'Revenue & Profit', icon: '💹', duration: '4 min',
          content: [
            'Revenue is total money coming IN from sales. Profit = Revenue - Expenses.',
            'Gross profit = Revenue - Cost of Goods Sold. Net profit = after ALL expenses including taxes.',
            'Break-even point: when revenue equals total costs. Above this = profit!',
            'Focus on profit margins, not just revenue. A business with $1M revenue but $1.1M expenses is losing money.'
          ],
          quiz: { q: 'What is the formula for Profit?', options: ['Revenue + Expenses', 'Revenue - Expenses', 'Expenses × Revenue', 'Revenue ÷ Expenses'], answer: 1 }
        }
      ]
    },
    {
      id: 'health', label: 'HEALTH', field: 'Health & Wellness', icon: '🏥',
      color: 0x0a3a2a, signColor: 0x00ff44, x: 56, z: 22,
      lessons: [
        {
          id: 1, title: 'Nutrition Basics', icon: '🥗', duration: '3 min',
          content: [
            'Food is fuel. The three macronutrients are: Proteins (build muscle), Carbohydrates (energy), Fats (brain health).',
            'Eat the rainbow — different colored vegetables provide different vitamins and minerals.',
            'Processed foods are often high in sugar, salt, and unhealthy fats. Cook whole foods when possible.',
            'Hydration matters! Drink 8 glasses (2 liters) of water daily for optimal body function.'
          ],
          quiz: { q: 'What are the three macronutrients?', options: ['Vitamins, Minerals, Water', 'Proteins, Carbs, Fats', 'Sugar, Salt, Fat', 'None of these'], answer: 1 }
        },
        {
          id: 2, title: 'Exercise & Fitness', icon: '💪', duration: '4 min',
          content: [
            'The WHO recommends 150 minutes of moderate exercise per week — just 30 minutes, 5 days!',
            'Types: Cardio (running, swimming) for heart health. Strength training for muscle. Flexibility for joints.',
            'Exercise releases endorphins — natural mood boosters. It\'s one of the best anti-depressants.',
            'Start small. A 10-minute walk daily is infinitely better than zero exercise. Build the habit first.'
          ],
          quiz: { q: 'How many minutes of exercise per week does WHO recommend?', options: ['60 minutes', '100 minutes', '150 minutes', '200 minutes'], answer: 2 }
        },
        {
          id: 3, title: 'Mental Health Awareness', icon: '🧠', duration: '4 min',
          content: [
            'Mental health is as important as physical health. 1 in 4 people experience mental health issues.',
            'Common conditions: Anxiety (excessive worry), Depression (persistent sadness), Stress (overwhelm).',
            'Techniques: Mindfulness meditation, deep breathing, regular sleep, social connections, therapy.',
            'Seeking help is a sign of strength, not weakness. Talk to someone you trust or a professional.'
          ],
          quiz: { q: 'What fraction of people experience mental health issues?', options: ['1 in 10', '1 in 4', '1 in 2', '1 in 20'], answer: 1 }
        },
        {
          id: 4, title: 'Sleep Science', icon: '😴', duration: '3 min',
          content: [
            'Adults need 7–9 hours of sleep per night. Sleep deprivation impairs memory, mood, and immunity.',
            'During sleep, your brain clears toxins, consolidates memories, and repairs the body.',
            'Tips for better sleep: consistent schedule, dark/cool room, no screens 1hr before bed, limit caffeine.',
            'Power naps (15–20 min) can boost alertness. Longer naps cause grogginess — the sleep inertia effect.'
          ],
          quiz: { q: 'How many hours of sleep do adults need?', options: ['4–5 hours', '5–6 hours', '7–9 hours', '10–12 hours'], answer: 2 }
        }
      ]
    }
  ];

  constructor(private ngZone: NgZone,private cdr: ChangeDetectorRef) { }

  /* ═══════════════════════════════════════
     LIFECYCLE
  ═══════════════════════════════════════ */
  ngOnInit() {
    window.addEventListener('keydown', this.kd);
    window.addEventListener('keyup', this.ku);
    document.addEventListener('mousemove', this.mm);
    document.addEventListener('pointerlockchange', this.plc);
  }

  ngAfterViewInit() {
    this.mmCtx = this.mmRef.nativeElement.getContext('2d')!;

    // استخدم setTimeout لتجنب الخطأ
    setTimeout(() => {
      this.detectMobile();
    }, 0);

    this.ngZone.runOutsideAngular(() => {
      this.initRdr();
      this.build();
      this.loop(0);
    });
  }

  ngOnDestroy() {
    if (this.aid) cancelAnimationFrame(this.aid);
    window.removeEventListener('keydown', this.kd);
    window.removeEventListener('keyup', this.ku);
    document.removeEventListener('mousemove', this.mm);
    document.removeEventListener('pointerlockchange', this.plc);
    this.rdr?.dispose();
    this.mc.forEach(m => m.dispose());
  }

  /* ═══════════════════════════════════════
     MOBILE DETECTION & OPTIMIZATION
  ═══════════════════════════════════════ */
  private detectMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (this.isMobile) {
      this.showMobileControls = true;
      this.optimizeForMobile();
      setTimeout(() => {
        this.initMobileControls();
        this.cdr.detectChanges(); // فرض تحديث التغييرات
      }, 100);
      this.requestLandscapeOrientation();

      this.ngZone.runOutsideAngular(() => {
        this.enableMobilePerformanceMode();
      });
    }
  }  private enableMobilePerformanceMode(): void {
    this.performanceMode = true;

    // تقليل جودة العرض
    if (this.rdr) {
      this.rdr.setPixelRatio(Math.min(devicePixelRatio, 1.0));
      this.rdr.shadowMap.enabled = false;
    }

    // تقليل عدد الإطارات في الثانية للموبايل
    this.frameSkip = 2;

    // إضافة class للـ body لتحسين CSS
    document.body.classList.add('mobile-performance');
    document.body.classList.add('performance-low');

    // تقليل عدد الأشجار والعناصر (اختياري)
    this.reduceSceneComplexity();
  }

  private reduceSceneComplexity(): void {
    // تقليل نطاق الرؤية
    if (this.scene) {
      const fog = this.scene.fog as THREE.Fog;
      if (fog) {
        fog.near = 40;
        fog.far = 80;
      }
    }

    // إخفاء النجوم لتحسين الأداء
    if (this.stars) {
      this.stars.visible = false;
    }

    // تقليل شدة الإضاءة
    if (this.lampLights) {
      this.lampLights.forEach(light => {
        light.intensity = Math.min(light.intensity, 1.5);
      });
    }
  }

  private optimizeForMobile(): void {
    this.quality = 'Low';
    this.sens = 0.15;

    if (this.rdr) {
      this.rdr.setPixelRatio(Math.min(devicePixelRatio, 1.2));
    }

    document.body.classList.add('performance-low');
  }

  private requestLandscapeOrientation(): void {
    const orientation = (screen.orientation as ScreenOrientationWithLock | null);

    if (orientation && orientation.lock) {
      orientation.lock('landscape').catch(() => {
        console.log('Orientation lock not supported');
      });
    }

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (window.innerHeight > window.innerWidth) {
          this.toast('📱 Rotate to landscape for better experience');
        }
      }, 100);
    });
  }

  private initMobileControls(): void {
    this.initJoystick();
    this.initMobileButtons();
  }

  private initJoystick(): void {
    this.joystickBase = document.getElementById('joystickBase');
    this.joystickThumb = document.getElementById('joystickThumb');

    if (!this.joystickBase) return;

    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.joystickRadius = rect.width / 2;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = clientX - this.joystickCenter.x;
      const dy = clientY - this.joystickCenter.y;
      const distance = Math.min(Math.sqrt(dx * dx + dy * dy), this.joystickRadius);
      const angle = Math.atan2(dy, dx);

      const thumbX = Math.cos(angle) * distance;
      const thumbY = Math.sin(angle) * distance;

      if (this.joystickThumb) {
        this.joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
      }

      this.mobileJoystickVector = {
        x: dx / this.joystickRadius,
        y: dy / this.joystickRadius
      };

      this.mobileJoystickActive = distance > 10;
    };

    const handleStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.joystickBase!.getBoundingClientRect();
      this.joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      handleMove(touch.clientX, touch.clientY);
    };

    const handleEnd = () => {
      this.mobileJoystickActive = false;
      this.mobileJoystickVector = { x: 0, y: 0 };
      if (this.joystickThumb) {
        this.joystickThumb.style.transform = 'translate(0px, 0px)';
      }
    };

    this.joystickBase.addEventListener('touchstart', handleStart);
    this.joystickBase.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    });
    this.joystickBase.addEventListener('touchend', handleEnd);
  }

  private initMobileButtons(): void {
    const jumpBtn = document.getElementById('mobileJumpBtn');
    const interactBtn = document.getElementById('mobileInteractBtn');
    const runBtn = document.getElementById('mobileRunBtn');
    const cameraBtn = document.getElementById('mobileCameraBtn');
    const timeBtn = document.getElementById('mobileTimeBtn');
    const pauseBtn = document.getElementById('mobilePauseBtn');

    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.doJump();
      });
    }

    if (interactBtn) {
      interactBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.interact();
      });
    }

    if (runBtn) {
      runBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.mobileRunActive = true;
        (runBtn as HTMLElement).style.background = 'rgba(0, 255, 136, 0.3)';
      });
      runBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.mobileRunActive = false;
        (runBtn as HTMLElement).style.background = '';
      });
    }

    if (cameraBtn) {
      cameraBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.camMode ^= 1;
        this.toast(this.camMode ? '👁 First Person' : '📷 Third Person');
      });
    }

    if (timeBtn) {
      timeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.timeOfDay = this.isDaytime ? 22 : 10;
        this.toast(this.isDaytime ? '🌙 Night mode' : '☀ Day mode');
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.isPaused = true;
      });
    }
  }

  /* ═══════════════════════════════════════
     INPUT
  ═══════════════════════════════════════ */
  private kd = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (this.isPaused) {
      if (k === 'escape') this.resume();
      return;
    }
    this.keys.add(k);
    if (k === ' ') { e.preventDefault(); this.doJump(); }
    if (k === 'e') { this.interact(); }
    if (k === 'c') {
      this.ngZone.run(() => {
        this.camMode ^= 1;
        this.toast(this.camMode ? '👁 First Person' : '📷 Third Person');
      });
    }
    if (k === 't') {
      this.ngZone.run(() => {
        this.timeOfDay = this.isDaytime ? 22 : 10;
      });
    }
    if (k === 'escape') {
      this.ngZone.run(() => {
        this.isPaused = true;
      });
    }
  };

  private ku = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private plc = () => { this.locked = document.pointerLockElement === this.canvasRef?.nativeElement; };

  private mm = (e: MouseEvent) => {
    if (!this.locked || this.isPaused || this.showSplash) return;
    const s = (this.sens * Math.PI) / 180;
    this.yaw += e.movementX * s;
    this.pitch = Math.max(-0.60, Math.min(0.78, this.pitch + e.movementY * s));
  };

  /* ═══════════════════════════════════════
     RENDERER
  ═══════════════════════════════════════ */
  private initRdr() {
    const cv = this.canvasRef.nativeElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 55, 140);

    this.cam = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 250);

    this.rdr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance', stencil: false });
    this.rdr.setSize(innerWidth, innerHeight);
    this.rdr.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.rdr.shadowMap.enabled = false;
    this.rdr.toneMapping = THREE.LinearToneMapping;

    const cores = navigator.hardwareConcurrency ?? 4;
    const mem = (navigator as any).deviceMemory ?? 4;
    const mob = /Mobi|Android/i.test(navigator.userAgent);
    this.quality = mob || cores <= 2 || mem <= 2 ? 'Low' : cores >= 8 && mem >= 8 ? 'High' : 'Medium';
    if (this.quality === 'Low') { this.rdr.setPixelRatio(1); }

    cv.addEventListener('click', () => {
      if (!this.showSplash && !this.isPaused && !this.locked) cv.requestPointerLock();
    });
  }

  /* ═══════════════════════════════════════
     MATERIAL HELPERS
  ═══════════════════════════════════════ */
  private mat(c: number): THREE.MeshLambertMaterial {
    if (!this.mc.has(c)) this.mc.set(c, new THREE.MeshLambertMaterial({ color: c }));
    return this.mc.get(c)!;
  }

  private matEm(c: number, em: number, ei: number): THREE.MeshLambertMaterial {
    const m = new THREE.MeshLambertMaterial({ color: c });
    m.emissive = new THREE.Color(em);
    m.emissiveIntensity = ei;
    return m;
  }

  private matAl(c: number, op: number): THREE.MeshLambertMaterial {
    return new THREE.MeshLambertMaterial({ color: c, transparent: true, opacity: op });
  }

  /* ═══════════════════════════════════════
     SCENE BUILD
  ═══════════════════════════════════════ */
  private build() {
    this.mkGround(); this.mkRoads(); this.mkBuildings();
    this.mkLearningBuildings();
    this.mkTrees(); this.mkLamps(); this.mkCars();
    this.mkPlayer(); this.mkNpcs(); this.mkLights(); this.mkStars();
  }

  /* ── Ground ── */
  private mkGround() {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(this.W, this.W), this.mat(0x3d7a3d));
    g.rotation.x = -Math.PI / 2;
    g.position.y = -0.05;
    this.scene.add(g);
    const sw = this.mat(0xa0988a);
    [[14, this.W], [this.W, 14]].forEach(([w, d]) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), sw);
      s.position.y = 0.025;
      this.scene.add(s);
    });
  }

  /* ── Roads ── */
  private mkRoads() {
    const road = this.mat(0x181818), yl = this.mat(0xf5c842), wh = this.mat(0xfafafa);
    [[this.W, 0.08, 10], [10, 0.08, this.W]].forEach(([w, h, d]) => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), road);
      r.position.y = 0.04;
      this.scene.add(r);
    });
    [-55, 55].forEach(x => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(8, 0.06, this.W), road);
      r.position.set(x, 0.03, 0);
      this.scene.add(r);
    });
    [-55, 55].forEach(z => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(this.W, 0.06, 8), road);
      r.position.set(0, 0.03, z);
      this.scene.add(r);
    });
    const dH = new THREE.BoxGeometry(4.5, 0.09, 0.16), dV = new THREE.BoxGeometry(0.16, 0.09, 4.5);
    const dp: number[] = [];
    for (let i = -85; i <= 85; i += 7) dp.push(i);
    const iH = new THREE.InstancedMesh(dH, yl, dp.length);
    const iV = new THREE.InstancedMesh(dV, yl, dp.length);
    dp.forEach((p, i) => {
      this.du.position.set(p, 0.046, 0);
      this.du.rotation.set(0, 0, 0);
      this.du.updateMatrix();
      iH.setMatrixAt(i, this.du.matrix);
      this.du.position.set(0, 0.046, p);
      this.du.updateMatrix();
      iV.setMatrixAt(i, this.du.matrix);
    });
    iH.instanceMatrix.needsUpdate = true;
    this.scene.add(iH);
    iV.instanceMatrix.needsUpdate = true;
    this.scene.add(iV);
    const cH = new THREE.BoxGeometry(5.8, 0.09, 0.38), cV = new THREE.BoxGeometry(0.38, 0.09, 5.8);
    for (let s = -2.5; s <= 2.5; s++) {
      [9.5, -9.5].forEach(o => {
        const h = new THREE.Mesh(cH, wh);
        h.position.set(o, 0.046, s);
        this.scene.add(h);
        const v = new THREE.Mesh(cV, wh);
        v.position.set(s, 0.046, o);
        this.scene.add(v);
      });
    }
  }

  /* ── Buildings ── */
  private mkBuildings() {
    const defs: any[] = [
      { x: -38, z: -50, w: 13, h: 32, d: 13, c: 0x1a3a6e, sky: true, neon: 0x2266ff },
      { x: 40, z: -50, w: 15, h: 28, d: 15, c: 0x0d2244, sky: true, neon: 0x22aaff },
      { x: -3, z: -80, w: 12, h: 40, d: 12, c: 0x0a1830, sky: true, neon: 0x22ff88 },
      { x: -60, z: -36, w: 10, h: 15, d: 10, c: 0x2a5a9a },
      { x: -76, z: -56, w: 11, h: 19, d: 11, c: 0x3a4a7a },
      { x: -28, z: -68, w: 8, h: 11, d: 8, c: 0x4a5a8a },
      { x: -55, z: -76, w: 9, h: 13, d: 9, c: 0x3a5a7a },
      { x: 63, z: -40, w: 10, h: 16, d: 10, c: 0x1a4a6a },
      { x: 76, z: -63, w: 10, h: 13, d: 10, c: 0x2a3a5a },
      { x: 50, z: -76, w: 8, h: 11, d: 8, c: 0x3a5a7a },
      { x: 56, z: 22, w: 13, h: 8, d: 17, c: 0x8a3a2a },
      { x: 70, z: 5, w: 10, h: 7, d: 13, c: 0x9a4a2a },
      { x: 76, z: 36, w: 11, h: 7, d: 11, c: 0x7a2a1a },
      { x: 60, z: 52, w: 8, h: 5, d: 10, c: 0xaa5a3a },
      { x: -56, z: 22, w: 10, h: 7, d: 10, c: 0x6a4030 },
      { x: -70, z: 5, w: 8, h: 5, d: 8, c: 0x7a5040 },
      { x: -66, z: 36, w: 9, h: 6, d: 9, c: 0x5a3020 },
      { x: -50, z: 52, w: 7, h: 5, d: 7, c: 0x8a6050 },
      { x: -30, z: 70, w: 8, h: 8, d: 8, c: 0x5a6a44 },
      { x: -13, z: 80, w: 7, h: 6, d: 7, c: 0x6a7a54 },
      { x: 11, z: 76, w: 8, h: 7, d: 8, c: 0x4a5a34 },
      { x: 30, z: 70, w: 9, h: 9, d: 9, c: 0x5a6a44 },
      { x: -24, z: -24, w: 6, h: 6, d: 6, c: 0x4a6a8a },
      { x: 24, z: -24, w: 6, h: 7, d: 6, c: 0x6a4a8a },
      { x: -24, z: 24, w: 6, h: 5, d: 6, c: 0x8a6a44 },
      { x: 24, z: 24, w: 6, h: 6, d: 6, c: 0x4a8a6a },
    ];
    defs.forEach(b => this.mkBuilding(b));
  }

  private mkBuilding(b: any) {
    const p = 0.35;
    this.boxes.push({ x0: b.x - b.w / 2 - p, x1: b.x + b.w / 2 + p, z0: b.z - b.d / 2 - p, z1: b.z + b.d / 2 + p });

    const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), this.mat(b.c));
    body.position.set(b.x, b.h / 2, b.z);
    this.scene.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.5, 0.5, b.d + 0.5), this.mat(Math.max(0, b.c - 0x0a0a0a)));
    roof.position.set(b.x, b.h + 0.25, b.z);
    this.scene.add(roof);

    const spX = 1.4, spY = 1.6;
    const cols = Math.max(1, Math.floor((b.w - 1.2) / spX));
    const rows = Math.max(1, Math.floor((b.h - 1.5) / spY));
    const wc2 = rows * cols * 2;
    const winMat = this.mat(b.sky ? 0x88ccff : 0xeecc66);
    const iW = new THREE.InstancedMesh(new THREE.BoxGeometry(0.68, 0.82, 0.04), winMat, wc2);
    let wi = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = b.x - ((cols - 1) * spX) / 2 + c * spX, wy = 1.4 + r * spY;
        this.du.position.set(wx, wy, b.z + b.d / 2 + 0.03);
        this.du.rotation.set(0, 0, 0);
        this.du.updateMatrix();
        if (wi < wc2) iW.setMatrixAt(wi++, this.du.matrix);
        this.du.position.set(wx, wy, b.z - b.d / 2 - 0.03);
        this.du.rotation.set(0, Math.PI, 0);
        this.du.updateMatrix();
        if (wi < wc2) iW.setMatrixAt(wi++, this.du.matrix);
      }
    }
    iW.instanceMatrix.needsUpdate = true;
    this.scene.add(iW);

    if (b.sky) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 5, 6), this.mat(0xcccccc));
      ant.position.set(b.x, b.h + 2.5, b.z);
      this.scene.add(ant);

      const blMat = this.matEm(0xff0000, 0xff0000, 1);
      const bl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 7, 5), blMat);
      bl.position.set(b.x, b.h + 5, b.z);
      bl.userData['blink'] = blMat;
      this.scene.add(bl);

      if (b.neon) {
        const nm = this.matEm(b.neon, b.neon, 2);
        const sg = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.5, 0.45, 0.12), nm);
        sg.position.set(b.x, 4, b.z + b.d / 2 + 0.1);
        this.scene.add(sg);
        this.neonMats.push(nm);
        const nl = new THREE.PointLight(b.neon, 0, 22, 1.3);
        nl.position.set(b.x, 5, b.z + b.d / 2 + 1.5);
        this.scene.add(nl);
        this.neonLights.push(nl);
      }
    }
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.3, 0.07), this.mat(0x111111));
    door.position.set(b.x, 1.15, b.z + b.d / 2 + 0.04);
    this.scene.add(door);
  }

  /* ── Trees - instanced ── */
  private mkTrees() {
    const trunk = this.mat(0x5c3317), leaf = this.mat(0x2a7a2a);
    const pos: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 22; i++) pos.push({ x: -78 + (i % 5) * 14 + (Math.random() - .5) * 4, z: 65 + Math.floor(i / 5) * 12, s: .75 + Math.random() * .45 });
    for (let x = -75; x <= 75; x += 14) {
      pos.push({ x, z: 9.8, s: .65 + Math.random() * .25 });
      pos.push({ x, z: -9.8, s: .65 + Math.random() * .25 });
    }
    for (let z = -75; z <= 75; z += 14) {
      pos.push({ x: 9.8, z, s: .65 + Math.random() * .25 });
      pos.push({ x: -9.8, z, s: .65 + Math.random() * .25 });
    }
    for (let i = 0; i < 22; i++) pos.push({ x: (Math.random() - .5) * 170, z: (Math.random() - .5) * 170, s: .5 + Math.random() * .55 });

    pos.forEach(p => {
      const r = 0.55 * p.s;
      this.treebox.push({ x0: p.x - r, x1: p.x + r, z0: p.z - r, z1: p.z + r });
    });

    const tI = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.2, 1.4, 6), trunk, pos.length);
    pos.forEach((p, i) => {
      this.du.position.set(p.x, 0.7 * p.s, p.z);
      this.du.scale.setScalar(p.s);
      this.du.rotation.set(0, 0, 0);
      this.du.updateMatrix();
      tI.setMatrixAt(i, this.du.matrix);
    });
    tI.instanceMatrix.needsUpdate = true;
    this.scene.add(tI);

    ([{ r: 1.3, h: 2.0, y: 1.5 }, { r: .95, h: 1.7, y: 2.7 }, { r: .62, h: 1.4, y: 3.6 }] as any[]).forEach(f => {
      const fI = new THREE.InstancedMesh(new THREE.ConeGeometry(f.r, f.h, 6), leaf, pos.length);
      pos.forEach((p, i) => {
        this.du.position.set(p.x, f.y * p.s, p.z);
        this.du.scale.setScalar(p.s);
        this.du.rotation.y = Math.random() * Math.PI;
        this.du.updateMatrix();
        fI.setMatrixAt(i, this.du.matrix);
      });
      fI.instanceMatrix.needsUpdate = true;
      this.scene.add(fI);
    });
  }

  /* ── Street lamps ── */
  private mkLamps() {
    const pole = this.mat(0x888888);
    const gGeo = new THREE.SphereGeometry(0.28, 9, 7);
    const pGeo = new THREE.CylinderGeometry(0.06, 0.10, 5.5, 7);
    const aGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.0, 5);
    const pp: { x: number; z: number }[] = [];
    for (let x = -65; x <= 65; x += 16) {
      pp.push({ x, z: 8.5 });
      pp.push({ x, z: -8.5 });
    }
    for (let z = -65; z <= 65; z += 16) {
      pp.push({ x: 8.5, z });
      pp.push({ x: -8.5, z });
    }
    pp.forEach(p => {
      const g = new THREE.Group();
      const poleMesh = new THREE.Mesh(pGeo, pole);
      poleMesh.position.set(0, 2.75, 0);
      g.add(poleMesh);
      const arm = new THREE.Mesh(aGeo, pole);
      arm.rotation.z = -Math.PI / 2;
      arm.position.set(1.0, 5.3, 0);
      g.add(arm);
      const gm = this.matEm(0xffeecc, 0xffcc66, 0.05);
      const globe = new THREE.Mesh(gGeo, gm);
      globe.position.set(2.0, 5.3, 0);
      g.add(globe);
      this.lampMats.push(gm);
      g.position.set(p.x, 0, p.z);
      this.scene.add(g);
      const pl = new THREE.PointLight(0xffcc44, 0, 22, 1.5);
      pl.position.set(p.x + 2.0, 5.3, p.z);
      this.scene.add(pl);
      this.lampLights.push(pl);
    });
  }

  /* ── Parked cars ── */
  private mkCars() {
    const cols = [0x1a1a2a, 0x8a1a1a, 0x1a1a8a, 0x2a4a2a, 0x8a8a2a, 0x3a3a3a, 0xaa3a2a];
    const wGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 10);
    const rGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.24, 8);
    const lg = new THREE.BoxGeometry(0.34, 0.18, 0.06);
    const gl = this.matAl(0x88aacc, 0.5);
    const wm = this.mat(0x111111), rm = this.mat(0xaaaaaa);
    const lm = this.matEm(0xffffee, 0xffffee, 0.4), tm = this.matEm(0xff2200, 0xff2200, 0.4);
    const cp = [
      { x: -20, z: 14, r: 0 }, { x: -8, z: 14, r: 0 }, { x: 8, z: 14, r: 0 }, { x: 22, z: 14, r: 0 },
      { x: -20, z: -14, r: Math.PI }, { x: -8, z: -14, r: Math.PI }, { x: 10, z: -14, r: Math.PI }, { x: 24, z: -14, r: Math.PI },
      { x: 14, z: -20, r: Math.PI / 2 }, { x: 14, z: -6, r: Math.PI / 2 }, { x: -14, z: 20, r: -Math.PI / 2 }, { x: -14, z: 8, r: -Math.PI / 2 },
    ];
    cp.forEach((p, i) => {
      const car = new THREE.Group();
      const bm = this.mat(cols[i % cols.length]);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 4.2), bm);
      body.position.y = 0.55;
      car.add(body);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.58, 2.35), bm);
      cab.position.set(0, 1.04, -0.2);
      car.add(cab);
      const wF = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.5, 0.06), gl);
      wF.position.set(0, 0.98, 0.98);
      wF.rotation.x = 0.34;
      car.add(wF);
      const wB = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.5, 0.06), gl);
      wB.position.set(0, 0.98, -1.38);
      wB.rotation.x = -0.34;
      car.add(wB);
      ([[-0.95, 0.3, 1.3], [0.95, 0.3, 1.3], [-0.95, 0.3, -1.3], [0.95, 0.3, -1.3]] as number[][]).forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(wGeo, wm);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, wy, wz);
        car.add(w);
        const r = new THREE.Mesh(rGeo, rm);
        r.rotation.z = Math.PI / 2;
        r.position.set(wx, wy, wz);
        car.add(r);
      });
      ([[-0.6, 0.55, 2.12], [0.6, 0.55, 2.12]] as number[][]).forEach(([lx, ly, lz]) => {
        const m = new THREE.Mesh(lg, lm);
        m.position.set(lx, ly, lz);
        car.add(m);
      });
      ([[-0.6, 0.55, -2.12], [0.6, 0.55, -2.12]] as number[][]).forEach(([lx, ly, lz]) => {
        const m = new THREE.Mesh(lg, tm);
        m.position.set(lx, ly, lz);
        car.add(m);
      });
      car.position.set(p.x, 0, p.z);
      car.rotation.y = p.r;
      this.scene.add(car);
      this.boxes.push({ x0: p.x - 2.5, x1: p.x + 2.5, z0: p.z - 2.5, z1: p.z + 2.5 });
    });
  }

  /* ═══════════════════════════════════════
     HUMAN BUILDER
  ═══════════════════════════════════════ */
  private mkHuman(sk: number, sh: number, pa: number, sho: number, ha: number, isP: boolean) {
    const root = new THREE.Group();

    const S = new THREE.MeshLambertMaterial({ color: sk });
    const SH = new THREE.MeshLambertMaterial({ color: sh });
    const PA = new THREE.MeshLambertMaterial({ color: pa });
    const SO = new THREE.MeshLambertMaterial({ color: sho });
    const H = new THREE.MeshLambertMaterial({ color: ha });
    const W = new THREE.MeshLambertMaterial({ color: 0xfafafa });
    const DK = new THREE.MeshLambertMaterial({ color: 0x030303 });
    const IR = new THREE.MeshLambertMaterial({ color: 0x2c4e8a });
    const LP = new THREE.MeshLambertMaterial({ color: Math.max(0, sk - 0x100408) });
    const NO = new THREE.MeshLambertMaterial({ color: Math.max(0, sk - 0x181010) });
    const BR = new THREE.MeshLambertMaterial({ color: Math.max(0, ha + 0x100000) });

    const mkFoot = (side: number) => {
      const g = new THREE.Group();
      g.position.set(side * 0.13, 0.05, 0);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.1, 0.33), SO);
      shoe.position.z = 0.04;
      g.add(shoe);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.04, 0.35), DK);
      sole.position.set(0, -0.07, 0.04);
      g.add(sole);
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 5), DK);
      toe.position.set(0, -0.02, 0.19);
      toe.scale.set(1, 0.55, 1);
      g.add(toe);
      return g;
    };

    const lFoot = mkFoot(-1);
    root.add(lFoot);
    const rFoot = mkFoot(1);
    root.add(rFoot);

    const lLeg = new THREE.Group();
    lLeg.position.set(-0.13, 0.08, 0);
    root.add(lLeg);
    const rLeg = new THREE.Group();
    rLeg.position.set(0.13, 0.08, 0);
    root.add(rLeg);
    [lLeg, rLeg].forEach(g => {
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.50, 8), PA);
      shin.position.y = 0.25;
      g.add(shin);
    });

    const mkThigh = (side: number) => {
      const g = new THREE.Group();
      g.position.set(side * 0.13, 0.75, 0);
      const th = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.09, 0.52, 8), PA);
      th.position.y = 0.26;
      g.add(th);
      const kn = new THREE.Mesh(new THREE.SphereGeometry(0.098, 7, 6), PA);
      kn.position.y = 0;
      kn.scale.set(1, 0.7, 1);
      g.add(kn);
      return g;
    };

    const lThigh = mkThigh(-1);
    lThigh.position.set(-0.13, 0.52, 0);
    root.add(lThigh);
    const rThigh = mkThigh(1);
    rThigh.position.set(0.13, 0.52, 0);
    root.add(rThigh);

    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.30, 0.27), PA);
    pelvis.position.y = 1.06;
    root.add(pelvis);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.07, 0.28), DK);
    belt.position.y = 1.22;
    root.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.03), new THREE.MeshLambertMaterial({ color: 0xccaa44 }));
    buckle.position.set(0, 1.22, 0.145);
    root.add(buckle);

    const body = new THREE.Group();
    body.position.y = 1.26;
    root.add(body);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.28), SH);
    torso.position.y = 0.31;
    body.add(torso);

    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.03), new THREE.MeshLambertMaterial({ color: Math.max(0, sh + 0x0a0a0a) }));
    pocket.position.set(0, 0.12, 0.145);
    torso.add(pocket);

    const shFill = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.46, 8), SH);
    shFill.rotation.z = Math.PI / 2;
    shFill.position.set(0, 0.56, 0);
    body.add(shFill);

    const mkArm = (side: number) => {
      const sh2 = new THREE.Group();
      sh2.position.set(side * 0.27, 0.56, 0);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.066, 0.34, 8), SH);
      upper.position.y = -0.17;
      sh2.add(upper);
      const elbow = new THREE.Group();
      elbow.position.y = -0.34;
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.057, 0.30, 8), S);
      fore.position.y = -0.15;
      elbow.add(fore);
      const hand = new THREE.Group();
      hand.position.y = -0.30;
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.07), S);
      hand.add(palm);
      for (let f = 0; f < 4; f++) {
        const fi = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.07, 0.025), S);
        fi.position.set(-0.04 + f * 0.027, -0.085, 0);
        hand.add(fi);
      }
      const th2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.055, 0.025), S);
      th2.position.set(side * 0.075, -0.04, 0);
      th2.rotation.z = side * 0.5;
      hand.add(th2);
      elbow.add(hand);
      sh2.add(elbow);
      body.add(sh2);
      return { sh: sh2, el: elbow };
    };

    const { sh: lArm, el: lFArm } = mkArm(-1);
    const { sh: rArm, el: rFArm } = mkArm(1);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.16, 8), S);
    neck.position.set(0, 1.90, 0);
    root.add(neck);

    const headG = new THREE.Group();
    headG.position.set(0, 2.10, 0);
    root.add(headG);
    const headM = new THREE.Mesh(new THREE.SphereGeometry(0.215, 14, 12), S);
    headM.scale.set(1, 1.08, 0.93);
    headG.add(headM);

    // Simplified hair for performance
    const hScalp = new THREE.Mesh(new THREE.SphereGeometry(0.232, 14, 11), H);
    hScalp.position.set(0, 0.03, -0.005);
    hScalp.scale.set(1.01, 0.72, 1.04);
    headG.add(hScalp);

    const hTop = new THREE.Mesh(new THREE.SphereGeometry(0.225, 12, 9), H);
    hTop.position.set(0, 0.10, -0.015);
    hTop.scale.set(1.0, 0.55, 1.0);
    headG.add(hTop);

    const hBack = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 9), H);
    hBack.position.set(0, 0.0, -0.095);
    hBack.scale.set(1.05, 0.80, 0.78);
    headG.add(hBack);

    const hSideL = new THREE.Mesh(new THREE.SphereGeometry(0.19, 11, 8), H);
    hSideL.position.set(-0.175, 0.02, -0.01);
    hSideL.scale.set(0.52, 0.68, 0.85);
    headG.add(hSideL);
    const hSideR = new THREE.Mesh(new THREE.SphereGeometry(0.19, 11, 8), H);
    hSideR.position.set(0.175, 0.02, -0.01);
    hSideR.scale.set(0.52, 0.68, 0.85);
    headG.add(hSideR);

    const hBangs = new THREE.Mesh(new THREE.SphereGeometry(0.18, 11, 8), H);
    hBangs.position.set(0, 0.09, 0.14);
    hBangs.scale.set(1.05, 0.38, 0.55);
    headG.add(hBangs);

    ([[-0.085], [0.085]] as number[][]).forEach(([ex]) => {
      const ew = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), W);
      ew.position.set(ex, 0.04, 0.195);
      ew.scale.set(1, 0.82, 0.7);
      headG.add(ew);
      const ir = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), IR);
      ir.position.set(ex, 0.04, 0.216);
      headG.add(ir);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(0.019, 7, 5), DK);
      pu.position.set(ex, 0.04, 0.226);
      headG.add(pu);
    });

    if (isP) {
      const bagM = new THREE.MeshLambertMaterial({ color: 0x1a2234 });
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.40, 0.15), bagM);
      bag.position.set(0, 0.31, -0.22);
      body.add(bag);
    }

    return {
      root, bones: {
        lLeg: lThigh, rLeg: rThigh,
        lArm, rArm, lFArm, rFArm,
        body, head: headG
      } as PlayerBones
    };
  }

  /* ── Learning Buildings ── */
  private mkLearningBuildings() {
    this.LEARN_BLDGS.forEach(b => {
      const bMat = new THREE.MeshLambertMaterial({ color: b.color });
      const w = 16, h = 14, d = 16;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat);
      body.position.set(b.x, h / 2, b.z);
      this.scene.add(body);
      this.boxes.push({ x0: b.x - w / 2 - 0.3, x1: b.x + w / 2 + 0.3, z0: b.z - d / 2 - 0.3, z1: b.z + d / 2 + 0.3 });

      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.6, d + 0.6), new THREE.MeshLambertMaterial({ color: Math.max(0, b.color - 0x0a0a0a) }));
      roof.position.set(b.x, h + 0.3, b.z);
      this.scene.add(roof);

      const signBgMat = new THREE.MeshLambertMaterial({ color: b.signColor });
      const signBg = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 0.25), signBgMat);
      signBg.position.set(b.x, h - 1.5, b.z + d / 2 + 0.15);
      this.scene.add(signBg);

      const signLight = new THREE.PointLight(b.signColor, 0, 25, 1.2);
      signLight.position.set(b.x, h - 1.5, b.z + d / 2 + 2);
      this.scene.add(signLight);
      this.neonLights.push(signLight);
    });
  }

  /* ── Player ── */
  private mkPlayer() {
    const { root, bones } = this.mkHuman(0xffccaa, 0x1c1c1c, 0x0d1a2e, 0x111111, 0x2a1400, true);
    root.scale.setScalar(0.60);
    root.rotation.y = Math.PI;
    this.player = root;
    this.pBones = bones;
    this.scene.add(root);
  }

  /* ── NPCs ── */
  private mkNpcs() {
    const skins = [0xffccaa, 0xffaa88, 0xddbb99, 0xcc9966, 0xf0c8a0, 0x8b6a4a, 0xa07850];
    const shirts = [0xff4444, 0x4444cc, 0xffaa00, 0x00aaff, 0xaa44ff, 0xff8800, 0x44ffaa, 0xdd2244];
    const pants = [0x222244, 0x442222, 0x224422, 0x333333, 0x1a1a1a];
    const hairs = [0x1a0800, 0x2a1800, 0x8b4513, 0xd4a017, 0x111111, 0x3a2010];
    const names = ['Alex', 'Emma', 'Sam', 'Olivia', 'Marcus', 'Lisa', 'James', 'Anna', 'Rob', 'Maria', 'Chen', 'Fatima'];

    let count = this.quality === 'Low' ? 8 : this.quality === 'High' ? 18 : 12;
    if (this.isMobile) count = Math.min(count, 6);

    for (let i = 0; i < count; i++) {
      const { root, bones } = this.mkHuman(
        skins[i % skins.length], shirts[i % shirts.length],
        pants[i % pants.length], 0x111111, hairs[i % hairs.length], false
      );
      const a = Math.random() * Math.PI * 2, r2 = 12 + Math.random() * 90;
      root.position.set(Math.cos(a) * r2, 0, Math.sin(a) * r2);
      root.scale.setScalar(0.65 + Math.random() * 0.06);
      this.scene.add(root);
      this.npcs.push({
        mesh: root, name: names[i % names.length],
        speed: 0.012 + Math.random() * 0.018,
        dir: new THREE.Vector3((Math.random() - .5) * 2, 0, (Math.random() - .5) * 2).normalize(),
        wc: Math.random() * Math.PI * 2,
        bones: { lLeg: bones.lLeg, rLeg: bones.rLeg, lArm: bones.lArm, rArm: bones.rArm }
      });
    }
  }

  /* ── Lights ── */
  private mkLights() {
    this.hemi = new THREE.HemisphereLight(0x87CEEB, 0x3a6a3a, 1.1);
    this.scene.add(this.hemi);
    this.amb = new THREE.AmbientLight(0x8aaabb, 0.65);
    this.scene.add(this.amb);
    this.sun = new THREE.DirectionalLight(0xfff8e0, 2.8);
    this.sun.position.set(50, 80, 30);
    this.scene.add(this.sun);
    this.moon = new THREE.DirectionalLight(0x7788bb, 0);
    this.moon.position.set(-40, 60, -30);
    this.scene.add(this.moon);
  }

  /* ── Stars ── */
  private mkStars() {
    const n = 800, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * .65), r = 210;
      p[i * 3] = r * Math.sin(ph) * Math.cos(t);
      p[i * 3 + 1] = r * Math.cos(ph);
      p[i * 3 + 2] = r * Math.sin(ph) * Math.sin(t);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0 }));
    this.scene.add(this.stars);
  }

  /* ═══════════════════════════════════════
     LIGHTING UPDATE
  ═══════════════════════════════════════ */
  private upLighting() {
    if (this.fr % 2 === 0) {
      this.timeOfDay += 0.0032;
      if (this.timeOfDay >= 24) this.timeOfDay -= 24;
    }
    const t = this.timeOfDay;
    this.isDaytime = t >= 6 && t <= 20;
    const sa = ((t - 6) / 14) * Math.PI, sh = Math.max(0, Math.sin(sa));
    this.sun.intensity = sh * 2.8;
    this.sun.position.set(Math.cos(sa - Math.PI / 2) * 80, Math.max(3, sh * 90), 20);
    this.moon.intensity = this.isDaytime ? 0 : 0.4;

    if (this.fr % 2 === 0) {
      let sr = 0.53, sg = 0.81, sb = 0.92;
      if (t < 5 || t > 21) { sr = 0.02; sg = 0.02; sb = 0.07; }
      else if (t < 7) { const f = (t - 5) / 2; sr = .02 + f * .51; sg = .02 + f * .79; sb = .07 + f * .85; }
      else if (t > 19 && t < 21) { const f = (21 - t) / 2; sr = .02 + f * .51; sg = .02 + f * .79; sb = .07 + f * .85; }
      this.sky.lerp(new THREE.Color(sr, sg, sb), 0.025);
      (this.scene.background as THREE.Color).copy(this.sky);
      (this.scene.fog as THREE.Fog).color.copy(this.sky);
      (this.scene.fog as THREE.Fog).near = this.isDaytime ? 55 : 35;
      (this.scene.fog as THREE.Fog).far = this.isDaytime ? 140 : 100;

      const warm = (t > 5.5 && t < 8) || (t > 18 && t < 20.5);
      if (warm) {
        this.sun.color.setHex(0xff7733);
        this.hemi.color.setHex(0xff9955);
      } else if (this.isDaytime) {
        this.sun.color.setHex(0xfff8e0);
        this.hemi.color.setHex(0x87CEEB);
        this.hemi.groundColor.setHex(0x3a6a3a);
      } else {
        this.sun.color.setHex(0x000000);
        this.hemi.color.setHex(0x07071a);
        this.hemi.groundColor.setHex(0x050505);
      }
      this.amb.intensity = this.isDaytime ? 0.6 + sh * 0.3 : 0.15;
      this.hemi.intensity = this.isDaytime ? 0.9 + sh * 0.4 : 0.20;

      const on = !this.isDaytime || t < 7.5 || t > 18.5;
      const li = on ? 3.0 : 0, ge = on ? 1.4 : 0.05;
      this.lampLights.forEach(l => { l.intensity += (li - l.intensity) * 0.08; });
      this.lampMats.forEach(m => { m.emissiveIntensity += (ge - m.emissiveIntensity) * 0.08; });
    }

    if (this.fr % 3 === 0) {
      const on = !this.isDaytime || t < 7.5 || t > 18.5;
      if (on) {
        const nb = 1.2 + Math.sin(Date.now() * .006) * .12;
        this.neonLights.forEach((l, i) => { l.intensity = nb + Math.sin(Date.now() * .004 + i) * .18; });
        this.neonMats.forEach((m, i) => { m.emissiveIntensity = 2.8 + Math.sin(Date.now() * .005 + i * 1.3) * .5; });
      } else {
        this.neonLights.forEach(l => { l.intensity = 0; });
        this.neonMats.forEach(m => { m.emissiveIntensity = 0; });
      }
    }

    if (this.fr % 48 === 0) {
      const bOn = Math.floor(Date.now() / 800) % 2 === 0;
      this.scene.traverse(o => {
        if (o.userData['blink']) (o.userData['blink'] as THREE.MeshLambertMaterial).emissiveIntensity = bOn ? 1.2 : 0;
      });
    }

    if (this.fr % 4 === 0) {
      const tOp = this.isDaytime ? 0 : Math.max(0, Math.min(1, t < 5 || t > 21 ? 1 : (t > 20 ? (t - 20) : (7 - t))));
      (this.stars.material as THREE.PointsMaterial).opacity += (tOp - (this.stars.material as THREE.PointsMaterial).opacity) * 0.08;
    }
  }

  /* ═══════════════════════════════════════
     COLLISION
  ═══════════════════════════════════════ */
  private hit(nx: number, nz: number): boolean {
    const r = 0.42;
    for (const b of this.boxes) if (nx + r > b.x0 && nx - r < b.x1 && nz + r > b.z0 && nz - r < b.z1) return true;
    for (const b of this.treebox) if (nx + r > b.x0 && nx - r < b.x1 && nz + r > b.z0 && nz - r < b.z1) return true;
    return false;
  }

  /* ═══════════════════════════════════════
     BONE ANIMATION
  ═══════════════════════════════════════ */
  private animP(moving: boolean, run: boolean, back = false) {
    const b = this.pBones;
    if (!b) return;
    if (moving) {
      this.wc += run ? 0.20 : 0.12;
      const dir = back ? -1 : 1;
      const c = this.wc, sw = dir * (run ? 0.60 : 0.44) * Math.sin(c);
      const lf = 0.18;
      b.lLeg.rotation.x += (sw - b.lLeg.rotation.x) * lf;
      b.rLeg.rotation.x += (-sw - b.rLeg.rotation.x) * lf;
      b.lArm.rotation.x += (-sw * .5 - b.lArm.rotation.x) * lf;
      b.rArm.rotation.x += (sw * .5 - b.rArm.rotation.x) * lf;
      const lEB = Math.max(0, -Math.sin(c)) * (run ? .9 : .55);
      const rEB = Math.max(0, -Math.sin(c + Math.PI)) * (run ? .9 : .55);
      b.lFArm.rotation.x += (lEB - b.lFArm.rotation.x) * lf;
      b.rFArm.rotation.x += (rEB - b.rFArm.rotation.x) * lf;
      b.body.rotation.y = sw * 0.08;
      b.head.rotation.z = Math.sin(c * .5) * 0.035;
    } else {
      this.wc += 0.02;
      const br = Math.sin(this.wc) * 0.01, lf = 0.06;
      b.lLeg.rotation.x *= (1 - lf);
      b.rLeg.rotation.x *= (1 - lf);
      b.lArm.rotation.x *= (1 - lf);
      b.rArm.rotation.x *= (1 - lf);
      b.lFArm.rotation.x *= (1 - lf);
      b.rFArm.rotation.x *= (1 - lf);
      b.body.rotation.y *= (1 - lf);
      b.lArm.rotation.z = br;
      b.rArm.rotation.z = -br;
    }
  }

  private animN(n: Npc) {
    const b = n.bones, sw = Math.sin(n.wc) * 0.38, lf = 0.12;
    b.lLeg.rotation.x += (sw - b.lLeg.rotation.x) * lf;
    b.rLeg.rotation.x += (-sw - b.rLeg.rotation.x) * lf;
    b.lArm.rotation.x += (-sw * .45 - b.lArm.rotation.x) * lf;
    b.rArm.rotation.x += (sw * .45 - b.rArm.rotation.x) * lf;
  }

  /* ═══════════════════════════════════════
     MOVEMENT
  ═══════════════════════════════════════ */
  private upMove(dt: number) {
    let fwd = false, back = false, left = false, righ = false;

    if (!this.isMobile) {
      fwd = this.keys.has('w') || this.keys.has('arrowup');
      back = this.keys.has('s') || this.keys.has('arrowdown');
      left = this.keys.has('a') || this.keys.has('arrowleft');
      righ = this.keys.has('d') || this.keys.has('arrowright');
    }

    if (this.isMobile && this.mobileJoystickActive) {
      const joyX = this.mobileJoystickVector.x;
      const joyY = this.mobileJoystickVector.y;

      if (Math.abs(joyX) > 0.15 || Math.abs(joyY) > 0.15) {
        fwd = joyY < -0.2;
        back = joyY > 0.2;
        left = joyX < -0.2;
        righ = joyX > 0.2;
      }
    }

    const run = this.keys.has('shift') || this.mobileRunActive;

    const dtCap = Math.min(dt, 0.033);
    const spd = (run ? 6.0 : 2.8) * dtCap;
    let dx = 0, dz = 0;
    if (fwd) dz -= spd;
    if (back) dz += spd;
    if (left) dx -= spd;
    if (righ) dx += spd;
    if (dx && dz) { dx *= 0.707; dz *= 0.707; }

    const moving = dx !== 0 || dz !== 0;

    if (moving) {
      const ca = Math.cos(this.yaw), sa = Math.sin(this.yaw);
      const nx = this.player.position.x + dx * ca - dz * sa;
      const nz = this.player.position.z + dx * sa + dz * ca;
      const bnd = this.W / 2 - 5;
      if (Math.abs(nx) < bnd && !this.hit(nx, this.player.position.z)) this.player.position.x = nx;
      if (Math.abs(nz) < bnd && !this.hit(this.player.position.x, nz)) this.player.position.z = nz;

      const targetFacing = this.yaw + Math.PI;
      let faceDiff = targetFacing - this.player.rotation.y;
      while (faceDiff > Math.PI) faceDiff -= Math.PI * 2;
      while (faceDiff < -Math.PI) faceDiff += Math.PI * 2;
      this.player.rotation.y += faceDiff * 0.18;

      this.spd = run ? 18 : 8;
    } else {
      this.spd = 0;
    }

    if (this.jumping) {
      this.player.position.y += this.jumpV * dt;
      this.jumpV -= 9.8 * dt * 0.32;
      if (this.player.position.y <= 0) {
        this.player.position.y = 0;
        this.jumping = false;
        this.jumpV = 0;
      }
    }

    this.animP(moving, run && moving, back);
    this.cx = Math.round(this.player.position.x);
    this.cz = Math.round(this.player.position.z);
  }

  /* ── Camera ── */
  private upCam() {
    const px = this.player.position.x;
    const py = this.player.position.y;
    const pz = this.player.position.z;

    if (this.camMode === 0) {
      const cosPitch = Math.cos(this.pitch);
      const sinPitch = Math.sin(this.pitch);

      const tx = px + Math.sin(this.yaw) * this.CAM_D * cosPitch;
      const ty = py + this.CAM_H + sinPitch * this.CAM_D * 0.55;
      const tz = pz + Math.cos(this.yaw) * this.CAM_D * cosPitch;

      const k = 1 - Math.pow(1 - this.CAM_SP, 1);
      this.cx_ += (tx - this.cx_) * k;
      this.cy_ += (ty - this.cy_) * k * 0.65;
      this.cz_ += (tz - this.cz_) * k;

      this.cam.position.set(this.cx_, Math.max(0.5, this.cy_), this.cz_);
      this.cam.lookAt(px, py + 0.75, pz);
    } else {
      this.cam.position.set(px, py + 0.90, pz);
      this.cam.rotation.order = 'YXZ';
      this.cam.rotation.y = this.yaw + Math.PI;
      this.cam.rotation.x = -this.pitch;
    }
  }

  /* ── NPCs ── */
  private upNpcs(now: number) {
    const bnd = this.W / 2 - 5, px = this.player.position.x, pz = this.player.position.z;
    const dc = now - this.npcT > 2500;
    this.npcs.forEach(n => {
      if (Math.abs(n.mesh.position.x) > bnd) n.dir.x *= -1;
      if (Math.abs(n.mesh.position.z) > bnd) n.dir.z *= -1;
      const nx = n.mesh.position.x + n.dir.x * n.speed, nz = n.mesh.position.z + n.dir.z * n.speed;
      if (!this.hit(nx, nz)) { n.mesh.position.x = nx; n.mesh.position.z = nz; } else { n.dir.x *= -1; n.dir.z *= -1; }
      const ty = Math.atan2(n.dir.x, n.dir.z);
      n.mesh.rotation.y += (ty - n.mesh.rotation.y) * 0.07;
      const ddx = n.mesh.position.x - px, ddz = n.mesh.position.z - pz, d2 = ddx * ddx + ddz * ddz;
      n.wc += n.speed * 7;
      if (d2 < 1600) this.animN(n);
      n.mesh.visible = d2 < 12000;
      if (dc && Math.random() < 0.06) n.dir.set((Math.random() - .5) * 2, 0, (Math.random() - .5) * 2).normalize();
    });
    if (dc) this.npcT = now;
  }

  /* ── Minimap ── */
  private upMinimap() {
    const ctx = this.mmCtx, S = 170, sc = S / this.W;
    const tx = (w: number) => w * sc + S / 2, tz = (w: number) => w * sc + S / 2;
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#161620';
    ctx.fillRect(0, tz(0) - 4, S, 8);
    ctx.fillRect(tx(0) - 4, 0, 8, S);
    ctx.fillStyle = '#111118';
    [-55, 55].forEach(v => { ctx.fillRect(0, tz(v) - 2, S, 4); ctx.fillRect(tx(v) - 2, 0, 4, S); });
    ctx.fillStyle = '#274278';
    this.boxes.slice(0, 26).forEach(b => { const bx = tx((b.x0 + b.x1) / 2), by = tz((b.z0 + b.z1) / 2); if (bx > 0 && bx < S && by > 0 && by < S) ctx.fillRect(bx - 3, by - 3, 6, 6); });
    ctx.fillStyle = '#f5c842';
    this.npcs.forEach(n => { const nx = tx(n.mesh.position.x), ny = tz(n.mesh.position.z); if (nx > 0 && nx < S && ny > 0 && ny < S) { ctx.beginPath(); ctx.arc(nx, ny, 2, 0, Math.PI * 2); ctx.fill(); } });
    const ppx = tx(this.player.position.x), ppy = tz(this.player.position.z);
    ctx.shadowColor = '#3f6';
    ctx.shadowBlur = 7;
    ctx.fillStyle = '#3f6';
    ctx.beginPath();
    ctx.arc(ppx, ppy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#3f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ppx, ppy);
    ctx.lineTo(ppx + Math.sin(-this.yaw) * 10, ppy + Math.cos(-this.yaw) * 10);
    ctx.stroke();
    if (this.mmDispRef?.nativeElement) { const d = this.mmDispRef.nativeElement.getContext('2d'); if (d) d.drawImage(this.mmRef.nativeElement, 0, 0); }
  }

  /* ── HUD ── */
  private upHUD(now: number) {
    this.hudN++;
    this.fpsN++;
    if (now - this.fpsT > 1000) { this.fpsVal = Math.round(this.fpsN * 1000 / (now - this.fpsT)); this.fpsN = 0; this.fpsT = now; }

    const h = Math.floor(this.timeOfDay), m = Math.floor((this.timeOfDay - h) * 60);
    this.timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    this.sunIco = this.isDaytime ? '☀' : '🌙';
    const t = this.timeOfDay;
    this.todTxt = t < 5 ? 'NIGHT' : t < 7 ? 'DAWN' : t < 12 ? 'MORNING' : t < 16 ? 'AFTERNOON' : t < 20 ? 'EVENING' : 'NIGHT';

    if (this.hudN % 20 === 0) {
      const px = this.player.position.x, pz = this.player.position.z;
      let loc = this.locName;
      for (const z of this.ZONES) { if (px >= z.x0 && px <= z.x1 && pz >= z.z0 && pz <= z.z1) { loc = z.n; break; } }
      let cl: Npc | null = null, minD = 25;
      for (const n of this.npcs) { const dx = n.mesh.position.x - px, dz = n.mesh.position.z - pz, d2 = dx * dx + dz * dz; if (d2 < minD * minD) { minD = Math.sqrt(d2); cl = n; } }

      let nearB: LearningBuilding | null = null;
      for (const b of this.LEARN_BLDGS) {
        const dx = b.x - px, dz = b.z - pz;
        if (Math.sqrt(dx * dx + dz * dz) < 7) { nearB = b; break; }
      }

      if (loc !== this.locName || cl !== this.nearNpc || nearB !== this.nearBldg) {
        this.locName = loc;
        this.nearNpc = cl;
        this.nearBldg = nearB;
        this.ngZone.run(() => { });
      }
    }
    if (this.hudN % 4 === 0) this.upMinimap();
    if (this.hudN % 8 === 0) this.ngZone.run(() => { });
  }

  /* ═══════════════════════════════════════
     MAIN LOOP
  ═══════════════════════════════════════ */
  private loop = (now: number) => {
    this.aid = requestAnimationFrame(this.loop);

    // تخطي الإطارات لتحسين الأداء على الموبايل
    if (this.performanceMode) {
      this.frameCounter++;
      if (this.frameCounter % this.frameSkip !== 0) {
        // تخطي بعض الإطارات
        this.lastT = now;
        return;
      }
    }

    this.fr++;
    const rawDt = (now - this.lastT) / 1000;
    const dt = Math.min(rawDt, 0.05);
    this.lastT = now;

    if (rawDt > 0.2) return;

    if (!this.isPaused && !this.showSplash) {
      this.upMove(dt);
      this.upCam();
      this.upNpcs(now);

      // تقليل تحديث الإضاءة على الموبايل
      if (!this.performanceMode || this.fr % 2 === 0) {
        this.upLighting();
      }

      this.upHUD(now);
    }
    this.rdr.render(this.scene, this.cam);
  };

  /* ═══════════════════════════════════════
     PUBLIC ACTIONS
  ═══════════════════════════════════════ */
  private doJump() { if (!this.jumping) { this.jumping = true; this.jumpV = 2.8; this.toast('⬆ Jump!'); } }

  private interact() {
    if (this.nearBldg) {
      this.ngZone.run(() => {
        this.activeBldg = this.nearBldg;
        this.lessonIndex = 0;
        this.activeLesson = this.nearBldg!.lessons[0];
        this.lessonCompleted = false;
        this.quizAnswered = -1;
        this.showLesson = true;
        document.exitPointerLock();
      });
    } else if (this.nearNpc) {
      this.ngZone.run(() => this.toast(`💬 Talking to ${this.nearNpc!.name}...`));
    } else {
      this.ngZone.run(() => this.toast('Walk up to a building and press E'));
    }
  }

  selectLesson(idx: number) {
    this.lessonIndex = idx;
    this.activeLesson = this.activeBldg!.lessons[idx];
    this.lessonCompleted = false;
    this.quizAnswered = -1;
  }

  finishLesson() {
    this.lessonCompleted = true;
    if (this.activeBldg && this.activeLesson) {
      this.completedLessons.add(`${this.activeBldg.id}-${this.activeLesson.id}`);
    }
  }

  answerQuiz(idx: number) {
    if (this.quizAnswered >= 0) return;
    this.quizAnswered = idx;
    this.quizCorrect = idx === this.activeLesson?.quiz?.answer;
    if (this.quizCorrect) this.finishLesson();
  }

  closeLesson() {
    this.ngZone.run(() => {
      this.showLesson = false;
      this.activeBldg = null;
      this.activeLesson = null;
    });
    setTimeout(() => this.canvasRef.nativeElement.requestPointerLock(), 100);
  }

  isLessonDone(bldgId: string, lessonId: number): boolean {
    return this.completedLessons.has(`${bldgId}-${lessonId}`);
  }

  getBldgProgress(bldgId: string): number {
    const total = this.LEARN_BLDGS.find(b => b.id === bldgId)?.lessons.length ?? 4;
    let done = 0;
    for (let i = 1; i <= total; i++) if (this.completedLessons.has(`${bldgId}-${i}`)) done++;
    return Math.round((done / total) * 100);
  }

  private toast(msg: string) {
    if (this.notifT) clearTimeout(this.notifT);
    this.ngZone.run(() => { this.notif = msg; });
    this.notifT = setTimeout(() => this.ngZone.run(() => { this.notif = null; }), 2500);
  }

  startGame() {
    this.showNameForm = true;
  }

  submitName() {
    const trimmed = this.playerName.trim();
    if (!trimmed || trimmed.length < 2) {
      this.nameError = 'Please enter at least 2 characters';
      return;
    }
    if (trimmed.length > 20) {
      this.nameError = 'Name must be 20 characters or less';
      return;
    }
    this.nameError = '';
    this.showSplash = false;
    this.showNameForm = false;
    setTimeout(() => this.canvasRef.nativeElement.requestPointerLock(), 120);
  }

  resume() { this.isPaused = false; setTimeout(() => this.canvasRef.nativeElement.requestPointerLock(), 120); }
  setTOD() { }
  toggleCtrl() { this.showCtrl = !this.showCtrl; }
  getSens() { return Math.round(this.sens) + '°/px'; }
  incSens() { this.sens = Math.min(0.5, this.sens + 0.01); }
  decSens() { this.sens = Math.max(0.02, this.sens - 0.01); }
  getDir() { const a = ((this.yaw * 180 / Math.PI) % 360 + 360) % 360; return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(a / 45) % 8]; }
  fpsColor() { return this.fpsVal < 30 ? '#f44' : this.fpsVal < 50 ? '#fa0' : '#3f6'; }

  @HostListener('window:resize')
  onResize() { if (!this.cam || !this.rdr) return; this.cam.aspect = innerWidth / innerHeight; this.cam.updateProjectionMatrix(); this.rdr.setSize(innerWidth, innerHeight); }
}
