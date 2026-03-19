import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  currentRoute: string = '';

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

  isAuthRoute(): boolean {
    return this.currentRoute.includes('/login') ||
           this.currentRoute.includes('/register') ||
           this.currentRoute.includes('/forgot-password')||
           this.currentRoute.includes('/verify-code')||
           this.currentRoute.includes('/reset-password');
  }
  title = 'X-Change';
}
