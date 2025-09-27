import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssessmentService } from '../../../services/assessment-service';
import { Router } from '@angular/router';
import { Assessment, CreateAssessmentDto } from '../../../Models/assessment.model';

@Component({
  selector: 'app-assessment-management',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './assessment-management.html',
  styleUrl: './assessment-management.css'
})

export class AssessmentManagement implements OnInit {
  assessments: Assessment[] = []; // STRONGLY-TYPED
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
      description: [''], // Description can be optional, hence no Validators.required if not strictly needed
      durationMinutes: [null, [Validators.required, Validators.min(1)]],
      // No instructionsFilePath here initially, as it's optional and might be handled separately (e.g., file upload)
      // If you plan to allow entering a URL/path directly, add:
      // instructionsFilePath: [''] 
    });
  }

  loadAssessments(): void {
    this.assessmentService.getAllAssessments().subscribe(
      (data: Assessment[]) => { // STRONGLY-TYPED DATA
        this.assessments = data;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error fetching assessments', error);
      }
    );
  }

  onSubmit(): void {
    if (this.assessmentForm.invalid) {
      this.assessmentForm.markAllAsTouched(); // Helps show validation messages
      return;
    }

    // Ensure the description is an empty string if null for DTO consistency
    const formValue = this.assessmentForm.value;
    const descriptionForDto = formValue.description || ''; // Convert null/undefined to empty string

    // Construct the DTO object explicitly
    const assessmentToSave: CreateAssessmentDto = {
      title: formValue.title,
      description: descriptionForDto, // Use the prepared description
      durationMinutes: formValue.durationMinutes,
      // instructionsFilePath: formValue.instructionsFilePath || undefined // Include if you added it to the form
    };

    if (this.isEditMode && this.selectedAssessmentId) {
      // Assuming updateAssessment also takes a CreateAssessmentDto (or an equivalent DTO for update)
      this.assessmentService.updateAssessment(this.selectedAssessmentId, assessmentToSave).subscribe(
        () => {
          this.resetForm();
          this.loadAssessments();
        },
        (error) => console.error('Error updating assessment', error)
      );
    } else {
      this.assessmentService.createAssessment(assessmentToSave).subscribe(
        () => {
          this.resetForm();
          this.loadAssessments();
        },
        (error) => console.error('Error creating assessment', error)
      );
    }
  }

  onEdit(assessment: Assessment): void { // STRONGLY-TYPED INPUT
    this.isEditMode = true;
    this.selectedAssessmentId = assessment.assessmentId;
    // When patching, ensure description is a string (not null) for form compatibility
    this.assessmentForm.patchValue({
        title: assessment.title,
        description: assessment.description || '', // Convert null to empty string for the form
        durationMinutes: assessment.durationMinutes
        // instructionsFilePath: assessment.instructionsFilePath || '' // If you add this field
    });
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
    // Re-initialize default values after reset if needed, e.g., for durationMinutes
    this.assessmentForm.get('durationMinutes')?.setValue(1); 
    this.isEditMode = false;
    this.selectedAssessmentId = null;
  }
}