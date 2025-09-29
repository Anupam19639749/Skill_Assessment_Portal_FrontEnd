import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd} from '@angular/router';
import { Auth } from '../../../services/auth';
import { User } from '../../../services/user';
import { NavigationService } from '../../../services/navigation.service';
import {jwtDecode} from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
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
  navbarHidden: boolean = false;

  userProfilePath: string | null = null;
  currentUserId: number | null = null;

  isMenuOpen: boolean = false;

  private tokenSubscription!: Subscription; 
  private navigationSubscription!: Subscription;
  private routerSubscription!: Subscription;
  private lastScrollTop: number = 0;

  constructor(
    private authService: Auth, 
    public router: Router, 
    private userService: User,
    private navigationService: NavigationService,
    private elementRef: ElementRef,
  ) { }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  closeMenu(): void {
    this.isMenuOpen = false;
  }


  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Update scrolled state
    this.isScrolled = scrollTop > 20;
    
    // Auto-hide/show navbar on scroll (optional feature)
    if (scrollTop > 100) {
      if (scrollTop > this.lastScrollTop && !this.navbarHidden) {
        // Scrolling down - hide navbar
        this.navbarHidden = true;
      } else if (scrollTop < this.lastScrollTop && this.navbarHidden) {
        // Scrolling up - show navbar
        this.navbarHidden = false;
      }
    } else {
      this.navbarHidden = false;
    }
    
    this.lastScrollTop = scrollTop;
    
    // Add/remove CSS classes for styling
    const navbar = this.elementRef.nativeElement.querySelector('.navbar');
    if (navbar) {
      navbar.classList.toggle('scrolled', this.isScrolled);
      navbar.classList.toggle('navbar-hidden', this.navbarHidden);
      navbar.classList.toggle('navbar-visible', !this.navbarHidden);
    }
  }

  ngOnInit(): void {
    this.tokenSubscription = this.authService.getTokenStream().subscribe(token => {
      this.isLoggedIn = !!token;
      this.updateUserInfo(token);
    });

    this.navigationSubscription = this.navigationService.showNavigation$.subscribe(
      show => this.showNavigation = show
    );

    // Reset navbar state on route change
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.navbarHidden = false;
        this.lastScrollTop = 0;
        window.scrollTo(0, 0); // Optional: scroll to top on navigation
      });
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) this.tokenSubscription.unsubscribe();
    if (this.navigationSubscription) this.navigationSubscription.unsubscribe();
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
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

  onLogoClick(): void {
    // Navigate to home or landing page based on login status
    if (this.isLoggedIn) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/']);
    }
  }

  onLogout(): void {
    if(confirm('Logging out!!!'))
    {
      this.authService.logout();
      this.navigationService.showNavigation();
      this.router.navigate(['/']);
    }
  }

  // Helper method to check if current route is landing page
  isLandingPage(): boolean {
    return this.router.url === '/';
  }

  // Helper method for getting navbar classes
  getNavbarClasses(): string {
    let classes = 'navbar';
    if (this.isScrolled) classes += ' scrolled';
    if (this.navbarHidden) classes += ' navbar-hidden';
    if (!this.navbarHidden) classes += ' navbar-visible';
    return classes;
  }
}