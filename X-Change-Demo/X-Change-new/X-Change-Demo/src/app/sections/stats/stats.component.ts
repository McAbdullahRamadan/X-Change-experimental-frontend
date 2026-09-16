import { AfterViewInit, Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-stats',
  standalone: false,
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent implements AfterViewInit {

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    const counters = this.el.nativeElement.querySelectorAll('.counter');

    counters.forEach((counter: any) => {
      const target = +counter.getAttribute('data-target');
      let count = 0;
      const increment = target / 100;

      const update = () => {
        count += increment;
        if (count < target) {
          counter.innerText = Math.floor(count);
          requestAnimationFrame(update);
        } else {
          counter.innerText = target + '+';
        }
      };

      update();
    });
  }
}
