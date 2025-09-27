import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';
import { Auth } from '../../../services/auth';
import { User } from '../../../services/user';
import { NavigationService } from '../../../services/navigation.service';
import {jwtDecode} from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs'; 
import { Users } from '../../../Models/user.model';

interface DecodedTokenPayload {
  fullName: string;
  email: string;
  role: string; 
  nameid?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  [key: string]: any; 
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  isManager: boolean = false;
  isCandidate: boolean = false;
  userName: string = 'Guest';
  showNavigation: boolean = true;
  isScrolled: boolean = false;

  userProfilePath: string | null = null;
  currentUserId: number | null = null;

  private tokenSubscription!: Subscription; 
  private navigationSubscription!: Subscription;

  constructor(
    private authService: Auth, 
    public router: Router, 
    private userService: User,
    private navigationService: NavigationService
  ) { }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 20;
  }

  ngOnInit(): void {
    this.tokenSubscription = this.authService.getTokenStream().subscribe(token => {
      this.isLoggedIn = !!token;
      this.updateUserInfo(token);
    });

    this.navigationSubscription = this.navigationService.showNavigation$.subscribe(
      show => this.showNavigation = show
    );
  }

  ngOnDestroy(): void {
    this.tokenSubscription.unsubscribe();
    this.navigationSubscription.unsubscribe();
  }

  updateUserInfo(token: string | null): void {
    if (token) {
      try {
        const decodedToken: DecodedTokenPayload = jwtDecode(token);
        
        const roleClaim = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        const fullName = decodedToken.fullName || decodedToken.email;

        const userIdClaim = decodedToken.nameid || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        this.currentUserId = userIdClaim ? +userIdClaim : null;

        this.userName = fullName;
        this.isManager = roleClaim === 'Admin' || roleClaim === 'Evaluator';
        this.isCandidate = roleClaim === 'Candidate';
        
        if (this.currentUserId) {
          this.userService.getUserById(this.currentUserId).subscribe({
            next: (user: Users) => {
              this.userProfilePath = user.profilePicturePath || null;
            },
            error: (err) => {
              console.error('Failed to load user profile for navbar:', err);
              this.userProfilePath = null;
            }
          });
        } else {
          this.userProfilePath = null;
        }

      } catch (error) {
        console.error('Error decoding token:', error);
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
    this.userProfilePath = null;
    this.currentUserId = null;
  }

  onLogout(): void {
    this.authService.logout();
    this.navigationService.showNavigation();
    this.router.navigate(['/login']);
  }
}