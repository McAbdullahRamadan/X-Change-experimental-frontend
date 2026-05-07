import { Component, OnInit, Renderer2 } from '@angular/core';
import { Course } from './Course ';

export interface CoursePublish {
  id: number;
  title: string;
  category: string;
  categoryKey: string;
  emoji: string;
  level: string;
  duration: number;
  lessons: number;
  rating: number;
  reviews: number;
  seatsFilled: number;
  joinedCount: number;
  instructorName: string;
  instructorTitle: string;
  instructorInitials: string;
  instructorGradient: string;
  verified: boolean;
  swapAvailable: boolean;
  trending: boolean;
  certificate: boolean;
  featured: boolean;
  enrolledAvatars: { initial: string; color: string }[];
}


@Component({
  selector: 'app-courses',
  standalone: false,
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css'
})
export class CoursesComponent implements OnInit {

  searchTerm: string = '';
  selectedFilter: string = 'all';
  selectedCategory: string = 'all';
  sortBy: string = 'popular';
  displayedCourses: number = 6;

  allCourses: Course[] = [];
  filteredCourses: Course[] = [];
  constructor(private renderer: Renderer2) {}


  ngOnInit() {
    this.checkTheme();
    this.initCourses();
    this.filterCourses();
  }

  initCourses() {
    this.allCourses = [
      {
        id: 1,
        title: 'Master Figma from Zero — Modern UI Design & Professional Prototyping',
        category: 'UI / UX Design',
        categoryKey: 'design',
        emoji: '🎨',
        level: 'intermediate',
        duration: 24,
        lessons: 48,
        rating: 4.9,
        reviews: 286,
        seatsFilled: 87,
        joinedCount: 1230,
        instructorName: 'Sarah Ahmed',
        instructorTitle: 'UI/UX Designer - Shopify',
        instructorInitials: 'SA',
        instructorGradient: 'linear-gradient(135deg,#ff3cac,#bf5af2)',
        verified: true,
        swapAvailable: true,
        trending: false,
        certificate: true,
        featured: true,
        enrolledAvatars: [
          { initial: 'M', color: '#ff3cac' },
          { initial: 'A', color: '#c8f135' },
          { initial: 'R', color: '#00f5d4' }
        ]
      },
      {
        id: 2,
        title: 'Python for Beginners: Learn Programming Step by Step',
        category: 'Coding & Tech',
        categoryKey: 'development',
        emoji: '💻',
        level: 'beginner',
        duration: 18,
        lessons: 36,
        rating: 4.8,
        reviews: 154,
        seatsFilled: 62,
        joinedCount: 897,
        instructorName: 'Khalid Nasser',
        instructorTitle: 'Software Engineer',
        instructorInitials: 'KN',
        instructorGradient: 'linear-gradient(135deg,#00f5d4,#059669)',
        verified: false,
        swapAvailable: false,
        trending: false,
        certificate: false,
        featured: false,
        enrolledAvatars: [
          { initial: 'Y', color: '#00f5d4' },
          { initial: 'L', color: '#ff3cac' }
        ]
      },
      {
        id: 3,
        title: 'Pro Photography: Lighting, Composition & Lightroom Editing',
        category: 'Photography',
        categoryKey: 'photography',
        emoji: '📸',
        level: 'advanced',
        duration: 30,
        lessons: 52,
        rating: 4.7,
        reviews: 98,
        seatsFilled: 41,
        joinedCount: 452,
        instructorName: 'Nora Quinn',
        instructorTitle: 'Professional Photographer',
        instructorInitials: 'NQ',
        instructorGradient: 'linear-gradient(135deg,#bf5af2,#7c3aed)',
        verified: false,
        swapAvailable: true,
        trending: false,
        certificate: false,
        featured: false,
        enrolledAvatars: [
          { initial: 'F', color: '#bf5af2' },
          { initial: 'E', color: '#3d5afe' }
        ]
      },
      {
        id: 4,
        title: 'Social Media Marketing: Rapid Growth Strategies That Actually Work',
        category: 'Digital Marketing',
        categoryKey: 'marketing',
        emoji: '📈',
        level: 'intermediate',
        duration: 12,
        lessons: 24,
        rating: 4.9,
        reviews: 212,
        seatsFilled: 78,
        joinedCount: 1145,
        instructorName: 'Omar Stark',
        instructorTitle: 'Digital Marketing Director',
        instructorInitials: 'OS',
        instructorGradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        verified: true,
        swapAvailable: false,
        trending: true,
        certificate: false,
        featured: false,
        enrolledAvatars: [
          { initial: 'H', color: '#ff3cac' },
          { initial: 'G', color: '#00f5d4' },
          { initial: 'S', color: '#c8f135' }
        ]
      },
      {
        id: 5,
        title: 'Guitar Basics: From Your First Chord to Your First Full Song',
        category: 'Music & Arts',
        categoryKey: 'music',
        emoji: '🎵',
        level: 'beginner',
        duration: 8,
        lessons: 20,
        rating: 4.6,
        reviews: 73,
        seatsFilled: 33,
        joinedCount: 312,
        instructorName: 'Lily Monroe',
        instructorTitle: 'Music Teacher',
        instructorInitials: 'LM',
        instructorGradient: 'linear-gradient(135deg,#ff3cac,#e11d48)',
        verified: false,
        swapAvailable: true,
        trending: false,
        certificate: false,
        featured: false,
        enrolledAvatars: [
          { initial: 'S', color: '#ff6b35' }
        ]
      },
      {
        id: 6,
        title: 'Spanish for Daily Conversations: Speak Confidently in 60 Days',
        category: 'Languages',
        categoryKey: 'all',
        emoji: '🗣️',
        level: 'intermediate',
        duration: 15,
        lessons: 40,
        rating: 4.9,
        reviews: 341,
        seatsFilled: 91,
        joinedCount: 1872,
        instructorName: 'Rosa Hernandez',
        instructorTitle: 'Language Coach',
        instructorInitials: 'RH',
        instructorGradient: 'linear-gradient(135deg,#16a34a,#15803d)',
        verified: true,
        swapAvailable: false,
        trending: false,
        certificate: false,
        featured: false,
        enrolledAvatars: [
          { initial: 'B', color: '#16a34a' },
          { initial: 'M', color: '#c8f135' },
          { initial: 'T', color: '#ff3cac' }
        ]
      },
      {
        id: 7,
        title: 'Advanced React: Hooks, Context & Performance Optimization',
        category: 'Coding & Tech',
        categoryKey: 'development',
        emoji: '⚛️',
        level: 'advanced',
        duration: 20,
        lessons: 42,
        rating: 4.9,
        reviews: 189,
        seatsFilled: 54,
        joinedCount: 678,
        instructorName: 'Alex Chen',
        instructorTitle: 'Senior Frontend Architect',
        instructorInitials: 'AC',
        instructorGradient: 'linear-gradient(135deg,#00f5d4,#0891b2)',
        verified: true,
        swapAvailable: false,
        trending: true,
        certificate: true,
        featured: false,
        enrolledAvatars: [
          { initial: 'J', color: '#3d5afe' },
          { initial: 'K', color: '#c8f135' }
        ]
      },
      {
        id: 8,
        title: 'Mastering Lightroom: Professional Photo Editing Workflow',
        category: 'Photography',
        categoryKey: 'photography',
        emoji: '🎨',
        level: 'intermediate',
        duration: 16,
        lessons: 34,
        rating: 4.8,
        reviews: 156,
        seatsFilled: 68,
        joinedCount: 823,
        instructorName: 'Maria Garcia',
        instructorTitle: 'Commercial Photographer',
        instructorInitials: 'MG',
        instructorGradient: 'linear-gradient(135deg,#bf5af2,#7c3aed)',
        verified: true,
        swapAvailable: true,
        trending: false,
        certificate: true,
        featured: false,
        enrolledAvatars: [
          { initial: 'D', color: '#ff6b35' },
          { initial: 'P', color: '#00f5d4' }
        ]
      }
    ];
  }

  filterCourses() {
    let filtered = [...this.allCourses];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(term) ||
        course.instructorName.toLowerCase().includes(term) ||
        course.category.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.categoryKey === this.selectedCategory);
    }

    // Special filters
    if (this.selectedFilter === 'trending') {
      filtered = filtered.filter(course => course.trending);
    } else if (this.selectedFilter === 'swap') {
      filtered = filtered.filter(course => course.swapAvailable);
    } else if (this.selectedFilter === 'free') {
      filtered = filtered.filter(course => course.swapAvailable);
    } else if (this.selectedFilter === 'certified') {
      filtered = filtered.filter(course => course.certificate);
    }

    this.filteredCourses = filtered;
    this.sortCourses();
    this.displayedCourses = 6; // Reset displayed count when filters change
  }

  sortCourses() {
    if (this.sortBy === 'popular') {
      this.filteredCourses.sort((a, b) => b.joinedCount - a.joinedCount);
    } else if (this.sortBy === 'rating') {
      this.filteredCourses.sort((a, b) => b.rating - a.rating);
    } else if (this.sortBy === 'hours') {
      this.filteredCourses.sort((a, b) => b.duration - a.duration);
    } else if (this.sortBy === 'newest') {
      this.filteredCourses.sort((a, b) => b.id - a.id);
    }
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.filterCourses();
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterCourses();
  }

  getStarRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '½';
    stars += '☆'.repeat(5 - Math.ceil(rating));
    return stars;
  }

  getDisplayedCourses(): Course[] {
    return this.filteredCourses.slice(0, this.displayedCourses);
  }

  get remainingCoursesCount(): number {
    return Math.min(6, this.filteredCourses.length - this.displayedCourses);
  }

  loadMore() {
    this.displayedCourses += 6;
  }

  enrollCourse(course: Course) {
    console.log('Enrolling in course:', course.title);
    alert(`✨ You've been enrolled in "${course.title}"! Check your dashboard.`);
  }

  requestSwap(course: Course) {
    console.log('Requesting skill swap for:', course.title);
    alert(`🔄 Swap request sent for "${course.title}"! The instructor will contact you soon.`);
  }



  checkTheme(): void {
    const isLightMode = document.body.classList.contains('light-mode');
    if (isLightMode) {
      this.renderer.addClass(document.body, 'light-mode');
    }
  }
}