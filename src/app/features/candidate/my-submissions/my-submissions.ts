import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe  } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../../services/auth';
import { UserAssessment } from '../../../services/user-assessment';
import { UserAssessmentStatus, UserAssessments  } from '../../../Models/user-assessment.model';
import { jwtDecode } from 'jwt-decode'; 

interface DecodedTokenPayload {
  fullName: string;
  email: string;
  role: string;
  nameid: string; // Typically the user ID
  ['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?: string;
  ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']?: string;
}

@Component({
  selector: 'app-my-submissions',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './my-submissions.html',
  styleUrl: './my-submissions.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MySubmissions implements OnInit {
  submittedAssessments: UserAssessments[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  // Expose enum to the template for direct use
  UserAssessmentStatus = UserAssessmentStatus; 

  constructor(
    private authService: Auth,
    private userAssessmentService: UserAssessment,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
        try {
            const decodedToken: DecodedTokenPayload = jwtDecode(token);
            const userRole = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            if (userRole === 'Candidate') {
                this.loadSubmittedAssessments();
            } else {
                this.errorMessage = 'You are not authorized to view this page.';
                this.isLoading = false;
                this.router.navigate(['/home']);
                this.cdr.detectChanges();
            }
        } catch (error) {
            this.errorMessage = 'Authentication error. Please log in again.';
            this.isLoading = false;
            this.router.navigate(['/login']);
            this.cdr.detectChanges();
        }
    } else {
        this.errorMessage = 'Authentication required. Please log in.';
        this.isLoading = false;
        this.router.navigate(['/login']);
        this.cdr.detectChanges();
    }
  }

  loadSubmittedAssessments(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const currentUserId = this.getUserIdFromToken();

    if (currentUserId === null) {
      this.errorMessage = 'User not logged in or ID not found. Please log in again.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      this.cdr.detectChanges();
      return;
    }

    this.userAssessmentService.getUserAssessments(currentUserId).subscribe({
      next: (data: UserAssessments[]) => {
        this.submittedAssessments = data.filter(ua => 
          ua.status === UserAssessmentStatus.Submitted || 
          ua.status === UserAssessmentStatus.Evaluated
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load your past submissions. Please try again later.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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
  
  getActionButtonRoute(userAssessmentId: number, status: UserAssessmentStatus): string[] | null {
    if (status === UserAssessmentStatus.Submitted || status === UserAssessmentStatus.Evaluated) {
      return ['/result', userAssessmentId.toString()];
    }
    return null;
  }

}
