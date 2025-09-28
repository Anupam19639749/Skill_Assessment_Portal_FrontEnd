import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

import { UserAssessment } from '../../services/user-assessment';
import { UserAssessments, UserAssessmentStatus } from '../../Models/user-assessment.model';
import { User } from '../../services/user';
import { Users } from '../../Models/user.model';

@Component({
  selector: 'app-user-assessment-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './user-assessment-history.html',
  styleUrl: './user-assessment-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class UserAssessmentHistory implements OnInit {
  userId!: number;
  candidateName: string = 'Candidate';
  candidateEmail: string = '';
  assessments: UserAssessments[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  UserAssessmentStatus = UserAssessmentStatus; // Expose enum to template

  constructor(
    private route: ActivatedRoute,
    private userAssessmentService: UserAssessment,
    private userService: User,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('userId');
      if (id) {
        this.userId = +id;
        this.loadCandidateDetails();
        this.loadUserAssessments();
      } else {
        this.errorMessage = 'User ID not found in route parameters.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadCandidateDetails(): void {
    if (!this.userId) return;
    this.userService.getUserById(this.userId).subscribe({
      next: (user: Users) => {
        this.candidateName = user.fullName || 'Unknown Candidate';
        this.candidateEmail = user.email || 'N/A';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching candidate details:', err);
        this.candidateName = 'Candidate (Details Error)';
        this.cdr.detectChanges();
      }
    });
  }

  private loadUserAssessments(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.userAssessmentService.getUserAssessments(this.userId).subscribe({
      next: (data: UserAssessments[]) => {
        // Sort assessments by scheduledAt date, most recent first
        this.assessments = data.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching user assessments:', error);
        this.errorMessage = 'Failed to load assessments. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Helper to determine badge class based on status
  getStatusBadgeClass(status: UserAssessmentStatus): string {
    switch (status) {
      case UserAssessmentStatus.NotStarted: return 'status-not-started';
      case UserAssessmentStatus.InProgress: return 'status-in-progress';
      case UserAssessmentStatus.Submitted: return 'status-submitted';
      case UserAssessmentStatus.Evaluated: return 'status-evaluated';
      case UserAssessmentStatus.Completed: return 'status-completed';
      default: return 'status-default';
    }
  }

  // Helper to get pass/fail status
  getPassFailStatus(assessment: UserAssessments): string {
    if (assessment.status === UserAssessmentStatus.Submitted) {
      return assessment.passed ? 'Passed' : 'Failed';
    }
    return 'N/A';
  }

  // Helper to get pass/fail class
  getPassFailClass(assessment: UserAssessments): string {
    if (assessment.status === UserAssessmentStatus.Submitted) {
      return assessment.passed ? 'pass-status' : 'fail-status';
    }
    return '';
  }

  // Helper to display marks - now only totalMarksObtained is relevant
  getMarksDisplay(assessment: UserAssessments): string {
    if (assessment.status === UserAssessmentStatus.Submitted && assessment.totalMarksObtained !== null && assessment.totalMarksObtained !== undefined) {
      return `${assessment.totalMarksObtained}`;
    }
    return 'N/A';
  }

  // Helper to display percentage
  getPercentageDisplay(assessment: UserAssessments): string {
    if (assessment.status === UserAssessmentStatus.Submitted && assessment.percentage !== null && assessment.percentage !== undefined) {
      return `${assessment.percentage.toFixed(0)}%`; // Format to whole number percentage
    }
    return 'N/A';
  }

  // Navigate back to the user management page
  goBack(): void {
    this.router.navigate(['/users']);
  }
}
