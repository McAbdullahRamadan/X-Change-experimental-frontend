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
  showNavbar = true;

  constructor(private router: Router){
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {

        if(event.url.includes('login') || event.url.includes('register')){
          this.showNavbar = false;
        } else {
          this.showNavbar = true;
        }

      });
  }
  title = 'X-Change';
}
