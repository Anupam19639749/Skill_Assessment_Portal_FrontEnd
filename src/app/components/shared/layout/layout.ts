import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';
import { Auth } from '../../../services/auth';
import {jwtDecode} from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs'; 
import { Users } from '../../../Models/user.model';

interface DecodedTokenPayload {
  fullName: string;
  email: string;
  role: string; // Or the full claim URL if that's what the backend sends
  // The claims sent by .NET are often 'nameid' and the full role claim URL
  [key: string]: any; 
}
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
        const decodedToken: DecodedTokenPayload = jwtDecode(token);
        
        // Use the explicit claim mapping from the .NET backend for the role
        const roleClaim = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        const fullName = decodedToken.fullName || decodedToken.email; // Fallback logic is good

        this.userName = fullName;
        this.isManager = roleClaim === 'Admin' || roleClaim === 'Evaluator';
        this.isCandidate = roleClaim === 'Candidate';

      } catch (error) {
        console.error('Error decoding token:', error);
        // Ensure state is reset if token is invalid
        this.resetUserState();
      }
    } else {
      this.resetUserState();
    }
  }

  resetUserState(): void {
    this.isLoggedIn = false;
    this.isManager = false;
    this.isCandidate = false;
    this.userName = '';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
