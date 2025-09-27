import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink  } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { Auth } from '../../services/auth';
import { UserAssessment } from '../../services/user-assessment';
import { jwtDecode } from 'jwt-decode';
import { UserAssessments, UserAssessmentStatus } from '../../Models/user-assessment.model';

// Define an interface for the raw decoded JWT payload
interface DecodedTokenPayload {
  fullName: string;
  email: string;
  role: string; // Or the full claim URL if that's what the backend sends
  nameid: string; // Typically the user ID
  // The claims sent by .NET are often 'nameid' and the full role claim URL
  ['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?: string;
  ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']?: string;
}


@Component({
  selector: 'app-home',
  standalone: true, // Mark as standalone
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './home.html',
  styleUrls: ['./home.css'] // CORRECTED: styleUrl to styleUrls
})
export class Home implements OnInit{
  isLoggedIn = false;
  isManager = false;
  isCandidate = false;
  userName = '';
  assignedAssessments: UserAssessments[] = []; // STRONGLY-TYPED

  // Use the UserAssessmentStatus enum for direct access if needed, or map to strings
  statusMap: string[] = ['Not Started', 'In Progress', 'Submitted', 'Evaluated', 'Completed']; 

  constructor(
    private authService: Auth,
    private router: Router,
    private userAssessmentService: UserAssessment,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.isLoggedIn = true;
      try {
        const decodedToken: DecodedTokenPayload = jwtDecode(token);
        this.userName = decodedToken.fullName || decodedToken.email;
        // Access role using either 'role' property or the full claim URL
        const userRole = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        
        this.isManager = userRole === 'Admin' || userRole === 'Evaluator';
        this.isCandidate = userRole === 'Candidate';

        if (this.isCandidate) {
          this.loadAssignedAssessments();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        // Reset login state if token is invalid
        this.resetUserState();
      }
    } else {
      this.resetUserState();
    }
  }

  loadAssignedAssessments(): void {
    const userId = this.getUserIdFromToken();
    if (userId !== null) { // Check for null explicitly
      this.userAssessmentService.getUserAssessments(userId).subscribe(
        (data: UserAssessments[]) => { // STRONGLY-TYPED DATA
          this.assignedAssessments = data;
          this.cdr.detectChanges();
        },
        (error) => console.error('Error fetching assessments', error)
      );
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
        // Access userId using either 'nameid' or the full claim URL
        const userIdClaim = decodedToken.nameid || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        return userIdClaim ? +userIdClaim : null; // Convert to number
      } catch (error) {
        console.error('Error parsing User ID from token:', error);
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
}