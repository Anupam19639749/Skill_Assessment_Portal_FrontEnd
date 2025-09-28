import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  private timeoutId: any;
  private warningTimeoutId: any;
  private readonly TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly WARNING_DURATION = 5 * 60 * 1000;  // 5 minutes before logout
  private lastActivity: number = Date.now();

  constructor(
    private router: Router,
    private authService: Auth
  ) {
    this.initActivityListeners();
  }

  startSession(): void {
    this.resetTimer();
  }

  stopSession(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);
  }

  private initActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), true);
    });
  }

  private updateActivity(): void {
    this.lastActivity = Date.now();
    this.resetTimer();
  }

  private resetTimer(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);

    if (!this.authService.getToken()) return;

    // Warning timer
    this.warningTimeoutId = setTimeout(() => this.showWarning(), this.TIMEOUT_DURATION - this.WARNING_DURATION);

    // Logout timer
    this.timeoutId = setTimeout(() => this.logout(), this.TIMEOUT_DURATION);
  }

  private showWarning(): void {
    const shouldContinue = confirm(
      'Your session will expire in 5 minutes due to inactivity. Click OK to continue your session.'
    );
    if (shouldContinue) this.resetTimer();
  }

  private logout(): void {
    this.authService.logout();
    alert('Your session has expired due to inactivity. Please log in again.');
    this.router.navigate(['/login']);
  }
}
