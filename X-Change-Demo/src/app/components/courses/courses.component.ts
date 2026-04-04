import { Component, OnInit, Renderer2 } from '@angular/core';



@Component({
  selector: 'app-courses',
  standalone: false,
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css'
})
export class CoursesComponent implements OnInit {
  // ... existing code ...

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    // متابعة حالة الـ theme من الـ body
    this.checkTheme();
  }

  checkTheme(): void {
    const isLightMode = document.body.classList.contains('light-mode');
    if (isLightMode) {
      this.renderer.addClass(document.body, 'light-mode');
    }
  }
}