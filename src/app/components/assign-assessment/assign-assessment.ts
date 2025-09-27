  import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
  import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
  import { CommonModule } from '@angular/common';
  import { AssessmentService } from '../../services/assessment-service';
  import { User } from '../../services/user';
  import { UserAssessment } from '../../services/user-assessment';
  import { Router } from '@angular/router';
  import { DatePipe } from '@angular/common'; 
  import { RouterLink } from '@angular/router';
  import { Assessment } from '../../Models/assessment.model';
  import { Users } from '../../Models/user.model';
  import { UserAssessments, UserAssessmentStatus } from '../../Models/user-assessment.model';
  import { AbstractControl, ValidatorFn } from '@angular/forms';

  @Component({
    selector: 'app-assign-assessment',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DatePipe, RouterLink],
    templateUrl: './assign-assessment.html',
    styleUrls: ['./assign-assessment.css']
  })
  export class AssignAssessment implements OnInit {
    assignmentForm!: FormGroup;
    assessments: Assessment[] = [];
    users: Users[] = [];
    existingAssignments: UserAssessments[] = [];
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
        scheduledAt: ['', [Validators.required, this.futureDateTimeValidator()]]
      });
    }

    private futureDateTimeValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const scheduledDateTime = control.value; // This will be a string in YYYY-MM-DDTHH:mm format
      
      if (!scheduledDateTime) {
        return null; // Don't validate if empty (Validators.required handles this)
      }

      const now = new Date();
      // Adjust 'now' to be a few seconds in the future for buffer, e.g., next minute
      now.setSeconds(0);
      now.setMilliseconds(0);
      now.setMinutes(now.getMinutes() + 1); // Set to the start of the next minute

      const selectedDate = new Date(scheduledDateTime);

      // Compare the selected date/time with the adjusted current time
      if (selectedDate < now) {
        return { 'pastDateTime': true }; // Validation failed: date/time is in the past
      }

      return null; // Validation passed
    };
  }


    loadData(): void {
      this.loadAssessments();
      this.loadUsers();
    }

    loadAssessments(): void {
      this.assessmentService.getAllAssessments().subscribe({
        next: (data: Assessment[]) => {
          this.assessments = data || [];
          this.cdr.detectChanges();
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
        next: (data: Users[]) => {
          this.users = (data || []).filter((user: Users) => user.roleName === 'Candidate'); 
          this.cdr.detectChanges();
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
      
      // Clear selections but NOT existing assignments during assessment change
      this.clearSelections();
      
      if (assessmentId && assessmentId !== '') {
        this.loadExistingAssignments(Number(assessmentId));
      } else {
        this.existingAssignments = [];
      }
      
      this.cdr.detectChanges();
    }

    // NEW: Separate method to clear only selections
    clearSelections(): void {
      this.selectedUserIds = [];
    }

    // MODIFIED: Better state management
    loadExistingAssignments(assessmentId: number): void {
      this.userAssessmentService.getAllUserAssessmentsByAssessmentId(assessmentId).subscribe({
        next: (data: UserAssessments[]) => {
          this.existingAssignments = data || [];
          // CRITICAL FIX: Sync selections with existing assignments
          this.syncSelectionsWithAssignments();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading existing assignments:', error);
          this.existingAssignments = [];
          this.clearSelections();
          this.cdr.detectChanges();
        }
      });
    }

    // NEW: Sync selected users with existing assignments
    syncSelectionsWithAssignments(): void {
      // Remove any selected users that are already assigned
      this.selectedUserIds = this.selectedUserIds.filter(userId => 
        !this.isUserAssigned(userId)
      );
    }

    isUserAssigned(userId: number): boolean {
      return this.existingAssignments.some((assignment: UserAssessments) => assignment.userId === userId);
    }

    // IMPROVED: Better checkbox handling
    onUserCheckboxChange(userId: number, event: any): void {
      const isChecked = event.target.checked;
      
      if (isChecked) {
        // Only add if not already assigned and not already selected
        if (!this.isUserAssigned(userId) && !this.selectedUserIds.includes(userId)) {
          this.selectedUserIds.push(userId);
        }
      } else {
        // Remove from selections
        this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
      }
      
      console.log('Selected user IDs:', this.selectedUserIds);
      this.cdr.detectChanges();
    }

    isUserSelected(userId: number): boolean {
      return this.selectedUserIds.includes(userId) && !this.isUserAssigned(userId);
    }

    onSubmit(): void {
      this.clearMessages();
      this.assignmentForm.markAllAsTouched();

      if (this.assignmentForm.invalid) {
        this.errorMessage = 'Please fill out all required fields and ensure the scheduled time is in the future.';
        return;
      }
      
      if (this.selectedUserIds.length === 0) {
        this.errorMessage = 'Please select at least one user.';
        return;
      }

      this.isLoading = true;
      const formValue = this.assignmentForm.value;

      this.userAssessmentService.assignAssessmentToUsers(
        Number(formValue.assessmentId),
        this.selectedUserIds,
        formValue.scheduledAt 
      ).subscribe({
        next: (response) => {
          this.successMessage = 'Assessment assigned successfully!';
          this.isLoading = false;
          
          // Clear only selections, keep form data and reload assignments
          this.clearSelections();
          this.loadExistingAssignments(Number(formValue.assessmentId));
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || error.message || 'Failed to assign assessment. Please try again.';
          this.cdr.detectChanges();
        }
      });
    }

    // MODIFIED: Better reset behavior
    resetForm(): void {
      this.assignmentForm.reset();
      this.clearSelections();
      this.existingAssignments = [];
      this.clearMessages();
      this.cdr.detectChanges();
    }

    clearMessages(): void {
      this.successMessage = null;
      this.errorMessage = null;
    }

    getAssignmentStatus(user: Users): string {
      const assignment = this.existingAssignments.find((a: UserAssessments) => a.userId === user.userId);
      if (!assignment) return '';

      const scheduledAt = new Date(assignment.scheduledAt);
      const now = new Date();
      const rawStatus = assignment.status;

      if (rawStatus === UserAssessmentStatus.NotStarted && scheduledAt < now) { 
        return 'Missed / Absent';
      }

      return this.statusMap[rawStatus];
    }
    
    canUnassign(user: Users): boolean { 
      const assignment = this.existingAssignments.find((a: UserAssessments) => a.userId === user.userId);
      if (!assignment) return false;
      return assignment.status === UserAssessmentStatus.NotStarted; 
    }
    
    // IMPROVED: Better unassign handling
    onUnassign(userAssessmentId: number): void {
      if (confirm('Are you sure you want to UNASSIGN this assessment?')) {
        const assessmentId = this.assignmentForm.get('assessmentId')?.value;
        
        this.userAssessmentService.unassignAssessment(userAssessmentId).subscribe({
          next: () => {
            this.successMessage = 'Assessment unassigned successfully!';
            this.clearMessages();
            
            // Reload assignments to reflect the change
            if (assessmentId) {
              this.loadExistingAssignments(Number(assessmentId));
            }
          },
          error: (error) => {
            console.error('Unassign failed:', error);
            this.errorMessage = error.error?.message || 'Failed to unassign. Test may have been started.';
            this.cdr.detectChanges();
          }
        });
      }
    }

    getUserAssessmentId(userId: number): number | undefined {
      return this.existingAssignments.find((a: UserAssessments) => a.userId === userId)?.userAssessmentId;
    }
  }