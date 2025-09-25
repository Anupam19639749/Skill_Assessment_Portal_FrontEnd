import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssessmentService } from '../../../services/assessment-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-assessment-management',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './assessment-management.html',
  styleUrl: './assessment-management.css'
})
export class AssessmentManagement implements OnInit {
  assessments: any[] = [];
  assessmentForm!: FormGroup;
  isEditMode = false;
  selectedAssessmentId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private assessmentService: AssessmentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadAssessments();
  }

  initForm(): void {
    this.assessmentForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      durationMinutes: [null, [Validators.required, Validators.min(1)]]
    });
  }

  loadAssessments(): void {
    this.assessmentService.getAllAssessments().subscribe(
      (data) => {
        this.assessments = data,
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error fetching assessments', error);
      }
    );
  }

  onSubmit(): void {
    if (this.assessmentForm.invalid) {
      return;
    }
    if (this.isEditMode && this.selectedAssessmentId) {
      this.assessmentService.updateAssessment(this.selectedAssessmentId, this.assessmentForm.value).subscribe(
        () => {
          this.resetForm();
          this.loadAssessments();
        },
        (error) => console.error('Error updating assessment', error)
      );
    } else {
      this.assessmentService.createAssessment(this.assessmentForm.value).subscribe(
        () => {
          this.resetForm();
          this.loadAssessments();
        },
        (error) => console.error('Error creating assessment', error)
      );
    }
  }

  onEdit(assessment: any): void {
    this.isEditMode = true;
    this.selectedAssessmentId = assessment.assessmentId;
    this.assessmentForm.patchValue(assessment);
  }

  onCancelEdit(): void {
    this.isEditMode = false;
    this.selectedAssessmentId = null;
    this.assessmentForm.reset();
  }

  onManageQuestions(assessmentId: number): void {
    this.router.navigate(['/assessments', assessmentId, 'questions']);
  }

  resetForm(): void {
    this.assessmentForm.reset();
    this.isEditMode = false;
    this.selectedAssessmentId = null;
  }
}
