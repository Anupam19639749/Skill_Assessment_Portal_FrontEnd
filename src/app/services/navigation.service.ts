import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private showNavigationSubject = new BehaviorSubject<boolean>(true);
  public showNavigation$ = this.showNavigationSubject.asObservable();

  hideNavigation(): void {
    this.showNavigationSubject.next(false);
  }

  showNavigation(): void {
    this.showNavigationSubject.next(true);
  }

  getCurrentState(): boolean {
    return this.showNavigationSubject.value;
  }
}