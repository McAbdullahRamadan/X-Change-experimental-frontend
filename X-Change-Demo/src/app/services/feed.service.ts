import { Injectable } from '@angular/core';
import { Userfeed } from '../components/feed/feed.component';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeedService {

  private userSubject = new BehaviorSubject<Userfeed | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private router: Router) {
    const saved = localStorage.getItem('xchange-user');
    if (saved) { this.userSubject.next(JSON.parse(saved)); }
  }

  get currentUser() { return this.userSubject.value; }
  get isLoggedIn() { return !!this.userSubject.value; }

  login(email: string, password: string): boolean {
    const user: Userfeed = {
      name: 'Ziad Vib3',
      handle: '@ziad.vib3',
      email,
      avatar: 'Z',
      xp: 2840,
      level: 17,
      followers: 1420,
      following: 284,
      vibes: 47
    };
    this.userSubject.next(user);
    localStorage.setItem('xchange-user', JSON.stringify(user));
    return true;
  }

  register(name: string, email: string, password: string): boolean {
    const handle = '@' + name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const user: Userfeed = {
      name,
      handle,
      email,
      avatar: name.charAt(0).toUpperCase(),
      xp: 0,
      level: 1,
      followers: 0,
      following: 0,
      vibes: 0
    };
    this.userSubject.next(user);
    localStorage.setItem('xchange-user', JSON.stringify(user));
    return true;
  }
}
