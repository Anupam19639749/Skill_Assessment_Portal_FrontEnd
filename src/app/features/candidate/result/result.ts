import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common'; // DecimalPipe for percentage formatting
import { forkJoin, of } from 'rxjs'; // For parallel API calls
import { catchError } from 'rxjs/operators';
import { Auth } from '../../../services/auth';
import { UserAssessment } from '../../../services/user-assessment';

import { UserAssessments, UserAssessmentStatus } from '../../../Models/user-assessment.model';
import { DetailedSubmission } from '../../../Models/detailed-submission.model';
import { jwtDecode } from 'jwt-decode';

interface DecodedTokenPayload {
  fullName: string;
  email: string;
  role: string;
  nameid: string;
  ['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?: string;
  ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']?: string;
}

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './result.html',
  styleUrl: './result.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Result implements OnInit {
  userAssessmentId: number | null = null;
  overallAssessment: UserAssessments | null = null;
  detailedSubmissions: DetailedSubmission[] = [];
  
  isLoading: boolean = true;
  errorMessage: string | null = null;

  UserAssessmentStatus = UserAssessmentStatus; // Expose enum to template

  constructor(
    private route: ActivatedRoute, // To get route parameters
    private router: Router,
    private authService: Auth,
    private userAssessmentService: UserAssessment,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('userAssessmentId');
      if (idParam) {
        this.userAssessmentId = +idParam; // Convert string param to number
        this.loadResultData();
      } else {
        this.errorMessage = 'No assessment ID provided.';
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/my-submissions']); // Redirect if no ID
      }
    });
  }

  loadResultData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const currentUserId = this.getUserIdFromToken();
    if (currentUserId === null) {
      this.errorMessage = 'Authentication required. Please log in.';
      this.isLoading = false;
      this.cdr.detectChanges();
      this.router.navigate(['/login']);
      return;
    }

    if (this.userAssessmentId === null) {
      this.errorMessage = 'Invalid assessment ID.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // Use forkJoin to make both API calls in parallel
    forkJoin({
      // Fetch all assessments to find the specific overall summary for this userAssessmentId
      // This is a workaround since we don't have a direct API for `UserAssessments` by ID.
      // If you create a `getUserAssessmentById(id: number)` API, replace this.
      allUserAssessments: this.userAssessmentService.getUserAssessments(currentUserId).pipe(
        catchError(err => {
          console.error('Failed to load all user assessments for summary:', err);
          this.errorMessage = 'Could not load overall assessment summary.';
          return of([]); // Return empty array on error to allow detailed submissions to proceed
        })
      ),
      // Fetch the detailed question-by-question submissions
      detailedSubmissions: this.userAssessmentService.getDetailedSubmissionResults(this.userAssessmentId).pipe(
        catchError(err => {
          console.error('Failed to load detailed submissions:', err);
          this.errorMessage = this.errorMessage ? this.errorMessage + ' Also failed to load detailed results.' : 'Failed to load detailed results.';
          return of([]); // Return empty array on error
        })
      )
    }).subscribe({
      next: ({ allUserAssessments, detailedSubmissions }) => {
        // Find the specific overall assessment summary
        this.overallAssessment = allUserAssessments.find(ua => ua.userAssessmentId === this.userAssessmentId) || null;

        // --- Critical authorization check on the frontend ---
        // Even though backend should protect it, this adds a layer of safety and UX.
        if (!this.overallAssessment || this.overallAssessment.userId !== currentUserId) {
          this.errorMessage = 'You are not authorized to view this result or the assessment does not exist.';
          this.isLoading = false;
          this.cdr.detectChanges();
          this.router.navigate(['/my-submissions']); // Redirect unauthorized users
          return;
        }

        // Ensure the assessment is actually submitted/evaluated before showing detailed results
        if (this.overallAssessment.status !== UserAssessmentStatus.Submitted && 
            this.overallAssessment.status !== UserAssessmentStatus.Evaluated) {
          this.errorMessage = `Assessment status is ${this.getStatusDisplayName(this.overallAssessment.status)}. Results are not available yet.`;
          this.isLoading = false;
          this.cdr.detectChanges();
          this.router.navigate(['/my-submissions']);
          return;
        }

        this.detailedSubmissions = detailedSubmissions;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { // This error block will catch any unhandled errors from forkJoin or next()
        console.error('Error loading result data:', err);
        this.errorMessage = this.errorMessage || 'An unexpected error occurred while loading results.';
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
  
  // Utility for displaying status (using enum directly)
  getStatusDisplayName(status: UserAssessmentStatus): string {
    return UserAssessmentStatus[status];
  }

  // Determine if user's answer matched correct answer for display purposes
  isAnswerCorrect(submission: DetailedSubmission): boolean {
    // For text answers, compare. For file answers, logic might differ (e.g., just show 'Submitted')
    if (submission.answerText !== null && submission.correctAnswer !== null) {
      return submission.answerText.trim().toLowerCase() === submission.correctAnswer.trim().toLowerCase();
    }
    // If it's a file path and marks are > 0, consider it 'correct' for display if no direct answer comparison
    if (submission.answerFilePath && submission.marksObtained > 0) {
      return true;
    }
    return submission.isCorrect; // Fallback to backend's isCorrect flag
  }

}
