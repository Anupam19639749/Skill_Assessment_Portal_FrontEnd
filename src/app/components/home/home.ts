import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink  } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { Auth } from '../../services/auth';
import { UserAssessment } from '../../services/user-assessment';
import { jwtDecode } from 'jwt-decode';
import { UserAssessments, UserAssessmentStatus } from '../../Models/user-assessment.model';
import { Dashboard } from '../../services/dashboard';

// Define an interface for the raw decoded JWT payload
interface DecodedTokenPayload {
  fullName: string;
  email: string;
  role: string; 
  nameid: string;
  // The claims sent by .NET are often 'nameid' and the full role claim URL
  ['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?: string;
  ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']?: string;
}


@Component({
  selector: 'app-home',
  standalone: true, 
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit{
  isLoggedIn = false;
  isManager = false;
  isCandidate = false;
  userName = '';
  assignedAssessments: UserAssessments[] = [];
  UserAssessmentStatus = UserAssessmentStatus

  statusMap: string[] = ['Not Started', 'In Progress', 'Submitted', 'Evaluated', 'Completed']; 

  // Dashboard Stats Properties
  adminStats: { totalUsers: number, totalAssessments: number, totalAssignments: number, totalCompleted: number } | null = null;
  isStatsLoading: boolean = false;

  constructor(
    private authService: Auth,
    private router: Router,
    private userAssessmentService: UserAssessment,
    private cdr: ChangeDetectorRef,
    private dashboardService: Dashboard
  ) { }

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.isLoggedIn = true;
      try {
        const decodedToken: DecodedTokenPayload = jwtDecode(token);
        this.userName = decodedToken.fullName || decodedToken.email;
        const userRole = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        
        this.isManager = userRole === 'Admin' || userRole === 'Evaluator';
        this.isCandidate = userRole === 'Candidate';

        if (this.isCandidate) {
          this.loadAssignedAssessments();
        } else {
            // For managers/admins, ensure any assessment list is cleared if not needed
            this.loadAdminStats();
            this.assignedAssessments = []; 
            this.cdr.detectChanges();
        }
      } catch (error) {
        this.resetUserState();
        this.cdr.detectChanges();
      }
    } else {
      this.resetUserState();
      this.cdr.detectChanges();
    }
  }
  loadAdminStats(): void {
    this.isStatsLoading = true;
    this.dashboardService.getAdminStats().subscribe({
      next: (stats) => {
        this.adminStats = stats;
        this.isStatsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching admin stats:', err);
        this.isStatsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAssignedAssessments(): void {
    const userId = this.getUserIdFromToken();
    if (userId !== null) {
      this.userAssessmentService.getUserAssessments(userId).subscribe({
        next: (data: UserAssessments[]) => {
          // --- REVISED: Filter to show only NotStarted or InProgress ---
          this.assignedAssessments = data.filter(ua =>
            ua.status === UserAssessmentStatus.NotStarted ||
            ua.status === UserAssessmentStatus.InProgress
          );
          this.cdr.detectChanges(); // Manually trigger change detection
        },
        error: (error) => {
          console.error('Error fetching assessments', error);
          // Optionally, set an errorMessage property here for display in HTML
          this.cdr.detectChanges();
        }
      });
    } else {
        // Handle case where user ID is not found (e.g., redirect to login)
        this.router.navigate(['/login']);
        this.cdr.detectChanges();
    }
  }

  onStartAssessment(userAssessmentId: number): void {
    this.router.navigate(['/take-assessment', userAssessmentId]);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private getUserIdFromToken(): number | null {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decodedToken: DecodedTokenPayload = jwtDecode(token);
        const userIdClaim = decodedToken.nameid || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        return userIdClaim ? +userIdClaim : null;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  private resetUserState(): void {
    this.isLoggedIn = false;
    this.isManager = false;
    this.isCandidate = false;
    this.userName = '';
    this.assignedAssessments = [];
  }
  
  // Utility for displaying status (using enum directly)
  getStatusDisplayName(status: UserAssessmentStatus): string {
    return UserAssessmentStatus[status];
  }
}