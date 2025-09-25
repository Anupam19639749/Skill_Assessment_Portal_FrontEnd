import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';
import { Auth } from '../../../services/auth';
import {jwtDecode} from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs'; 

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, CommonModule, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit, OnDestroy{
  isLoggedIn = false;
  isManager = false;
  isCandidate = false;
  userName = '';

  private tokenSubscription!: Subscription; 
  constructor(private authService: Auth, public router: Router) { }

  ngOnInit(): void {
    this.tokenSubscription = this.authService.getTokenStream().subscribe(token => {
      this.isLoggedIn = !!token;
      this.updateUserInfo(token);
    });
  }

  ngOnDestroy(): void {
    this.tokenSubscription.unsubscribe(); // Prevent memory leaks
  }

  updateUserInfo(token: string | null): void {
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.userName = decodedToken.fullName || decodedToken.email; // Fallback to email
        const userRole = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        this.isManager = userRole === 'Admin' || userRole === 'Evaluator';
        this.isCandidate = userRole === 'Candidate';
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      this.isLoggedIn = false;
      this.isManager = false;
      this.isCandidate = false;
      this.userName = '';
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
