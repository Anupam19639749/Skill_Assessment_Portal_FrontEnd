import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssessmentService } from '../../services/assessment-service';
import { User } from '../../services/user';
import { UserAssessment } from '../../services/user-assessment';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common'; 
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-assign-assessment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, RouterLink],
  templateUrl: './assign-assessment.html',
  styleUrls: ['./assign-assessment.css']
})
export class AssignAssessment implements OnInit {
  assignmentForm!: FormGroup;
  assessments: any[] = [];
  users: any[] = [];
  existingAssignments: any[] = [];
  selectedUserIds: number[] = [];
  statusMap: string[] = ['Not Started', 'In Progress', 'Submitted', 'Evaluated', 'Completed']; 
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private assessmentService: AssessmentService,
    private userService: User,
    private userAssessmentService: UserAssessment,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  initForm(): void {
    this.assignmentForm = this.fb.group({
      assessmentId: ['', Validators.required],
      scheduledAt: ['', Validators.required]
    });
  }

  loadData(): void {
    // Load both assessments and users
    this.loadAssessments();
    this.loadUsers();
  }

  loadAssessments(): void {
    this.assessmentService.getAllAssessments().subscribe({
      next: (data) => {
        this.assessments = data || [];
        console.log('Loaded assessments:', this.assessments);
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error) => {
        console.error('Error loading assessments:', error);
        this.errorMessage = 'Failed to load assessments.';
        this.cdr.detectChanges();
      }
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = (data || []).filter(user => user.roleName === 'Candidate');
        console.log('Loaded users:', this.users);
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Failed to load users.';
        this.cdr.detectChanges();
      }
    });
  }

  onAssessmentChange(): void {
    const assessmentId = this.assignmentForm.get('assessmentId')?.value;
    
    // Reset user selections
    this.selectedUserIds = [];
    this.existingAssignments = [];
    
    if (assessmentId && assessmentId !== '') {
      this.loadExistingAssignments(Number(assessmentId));
    }
    
    this.cdr.detectChanges();
  }

  loadExistingAssignments(assessmentId: number): void {
    this.userAssessmentService.getAllUserAssessmentsByAssessmentId(assessmentId).subscribe({
      next: (data) => {
        this.existingAssignments = data || [];
        console.log('Existing assignments:', this.existingAssignments);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading existing assignments:', error);
        this.existingAssignments = [];
        this.cdr.detectChanges();
      }
    });
  }

  isUserAssigned(userId: number): boolean {
    return this.existingAssignments.some(assignment => assignment.userId === userId);
  }

  onUserCheckboxChange(userId: number, event: any): void {
    if (event.target.checked) {
      if (!this.selectedUserIds.includes(userId)) {
        this.selectedUserIds.push(userId);
      }
    } else {
      this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
    }
    console.log('Selected user IDs:', this.selectedUserIds);
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUserIds.includes(userId);
  }

  selectAllUsers(): void {
    this.selectedUserIds = this.users
      .filter(user => !this.isUserAssigned(user.userId))
      .map(user => user.userId);
  }

  clearAllUsers(): void {
    this.selectedUserIds = [];
  }

  onSubmit(): void {
    this.clearMessages();

    // Mark form as touched to show validation errors
    this.assignmentForm.markAllAsTouched();

    // Validate form
    if (this.assignmentForm.invalid) {
      this.errorMessage = 'Please fill out all required fields.';
      return;
    }

    // Validate user selection
    if (this.selectedUserIds.length === 0) {
      this.errorMessage = 'Please select at least one user.';
      return;
    }

    this.isLoading = true;
    const formValue = this.assignmentForm.value;

    console.log('Submitting assignment:', {
      assessmentId: Number(formValue.assessmentId),
      userIds: this.selectedUserIds,
      scheduledAt: formValue.scheduledAt
    });

    this.userAssessmentService.assignAssessmentToUsers(
      Number(formValue.assessmentId),
      this.selectedUserIds,
      formValue.scheduledAt
    ).subscribe({
      next: (response) => {
        console.log('Assignment successful:', response);
        this.successMessage = response?.message || 'Assessment assigned successfully!';
        this.resetForm();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Assignment failed:', error);
        this.isLoading = false;
        
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Failed to assign assessment. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.assignmentForm.reset();
    this.selectedUserIds = [];
    this.existingAssignments = [];
    this.clearMessages();
    this.cdr.detectChanges();
  }

  clearMessages(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  getAssignmentStatus(user: any): string {
    const assignment = this.existingAssignments.find(a => a.userId === user.userId);
    if (!assignment) return '';

    const scheduledAt = new Date(assignment.scheduledAt);
    const now = new Date();
    const rawStatus = assignment.status;

    // 1. Check for Missed/Absent status
    // If status is "Not Started" (0) AND the scheduled time is in the past
    if (rawStatus === 0 && scheduledAt < now) {
      return 'Missed / Absent';
    }

    // 2. Return standard status from map
    return this.statusMap[rawStatus];
  }
  
  canUnassign(user: any): boolean {
    const assignment = this.existingAssignments.find(a => a.userId === user.userId);
    if (!assignment) return false;

    // Only allow unassign if status is "Not Started" (0) or "Missed" (which is status 0 + past time)
    return assignment.status === 0;
  }
  
  onUnassign(userAssessmentId: number): void {
    if (confirm('Are you sure you want to UNASSIGN this assessment?')) {
      this.userAssessmentService.unassignAssessment(userAssessmentId).subscribe({
        next: () => {
          alert('Assessment unassigned successfully!');
          // After unassign, reload assignments to update the UI
          this.onAssessmentChange(); 
        },
        error: (error) => {
          console.error('Unassign failed:', error);
          alert(error.error?.message || 'Failed to unassign. Test may have been started.');
        }
      });
    }
  }

  // Helper method to get the UserAssessmentId for the unassign button
  getUserAssessmentId(userId: number): number {
    return this.existingAssignments.find(a => a.userId === userId)?.userAssessmentId;
  }
}