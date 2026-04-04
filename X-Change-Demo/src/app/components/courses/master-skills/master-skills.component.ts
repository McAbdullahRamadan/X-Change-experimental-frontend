import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-master-skills',
  standalone: false,
  templateUrl: './master-skills.component.html',
  styleUrl: './master-skills.component.css'
})
export class MasterSkillsComponent {
  constructor(private router: Router) {}

  navigateToCourses(category: string): void {

    this.router.navigate(['/courses'], {
      queryParams: { category: category }
    });
}
}