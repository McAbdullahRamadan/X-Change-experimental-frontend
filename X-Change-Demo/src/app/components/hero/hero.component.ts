import { AfterViewInit, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: false,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, AfterViewInit {

  ngOnInit(): void {
    // Optional: Add any initialization logic
  }

  ngAfterViewInit(): void {
    // Trigger animation when component is in view
    this.checkAndAnimate();
  }

  checkAndAnimate(): void {
    const section = document.querySelector('.hero');
    if (section) {
      section.classList.add('revealed');
    }
  }

  onStartLearning(): void {
    // TODO: Navigate to courses page
    console.log('Start Learning clicked');
    // this.router.navigate(['/courses']);
  }

  onTeachSkill(): void {
    // TODO: Navigate to create course page
    console.log('Teach a Skill clicked');
    // this.router.navigate(['/courses/create']);
  }
}