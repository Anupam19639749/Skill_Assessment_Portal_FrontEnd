import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink  } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { Auth } from '../../services/auth';
import { UserAssessment } from '../../services/user-assessment';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-home',
  standalone: true, // Mark as standalone
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit{
  isLoggedIn = false;
  isManager = false;
  isCandidate = false;
  userName = '';
  assignedAssessments: any[] = [];

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
        const decodedToken: any = jwtDecode(token);
        this.userName = decodedToken.fullName || decodedToken.email;
        const userRole = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        this.isManager = userRole === 'Admin' || userRole === 'Evaluator';
        this.isCandidate = userRole === 'Candidate';

        if (this.isCandidate) {
          this.loadAssignedAssessments();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }

  loadAssignedAssessments(): void {
    const userId = this.getUserIdFromToken();
    if (userId) {
      this.userAssessmentService.getUserAssessments(userId).subscribe(
        (data) => {
          this.assignedAssessments = data,
          this.cdr.detectChanges();
        },
        (error) => console.error('Error fetching assessments', error)
      );
    }
  }

  onStartAssessment(userAssessmentId: number): void {
    // Navigate to the take-assessment page with the userAssessmentId
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
        const decodedToken: any = jwtDecode(token);
        const userId = decodedToken.nameid || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        return userId ? +userId : null;
      } catch (error) {
        return null;
      }
    }
    return null;
  }
}
