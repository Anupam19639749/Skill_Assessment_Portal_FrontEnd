import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssessmentService } from '../../../services/assessment-service';
import { Question, QuestionType, DifficultyLevel, CreateQuestionDto } from '../../../Models/assessment.model';

@Component({
  selector: 'app-question-management',
  standalone: true, // Mark as standalone
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './question-management.html',
  styleUrls: ['./question-management.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionManagement implements OnInit{
  assessmentId!: number;
  questions: Question[] = []; // STRONGLY-TYPED
  questionForm!: FormGroup;
  isEditMode = false;
  selectedQuestionId: number | null = null;
  
  // Directly use enum values for question types and difficulty levels from the model
  questionTypes: { value: QuestionType, name: string, disabled: boolean}[] = [
    { value: QuestionType.MCQ, name: 'MCQ', disabled: false },
    { value: QuestionType.Descriptive, name: 'Descriptive', disabled: true },
    { value: QuestionType.Coding, name: 'Coding', disabled: true },
    { value: QuestionType.FileUpload, name: 'FileUpload', disabled: true }
  ];
  difficultyLevels: { value: DifficultyLevel, name: string }[] = [
    { value: DifficultyLevel.Easy, name: 'Easy' },
    { value: DifficultyLevel.Medium, name: 'Medium' },
    { value: DifficultyLevel.Hard, name: 'Hard' }
  ];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private assessmentService: AssessmentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.assessmentId = +params['assessmentId'];
      this.loadQuestions();
    });
    this.initForm();
  }

  initForm(): void {
    this.questionForm = this.fb.group({
      questionText: ['', Validators.required],
      questionType: [QuestionType.MCQ, Validators.required], // Use enum value
      options: this.fb.array<string>([]), // Specify array type as string
      correctAnswer: ['', Validators.required],
      difficultyLevel: [DifficultyLevel.Easy, Validators.required], // Use enum value
      maxMarks: [1, [Validators.required, Validators.min(1)]],
      referenceFilePath: [''] 
    });
    this.addOption(); // Add one option field by default for MCQ
    
    // Optional: Add logic to handle option visibility based on question type
    this.questionForm.get('questionType')?.valueChanges.subscribe(type => {
      if (type === QuestionType.MCQ) {
        if (this.options.length === 0) {
          this.addOption(); // Ensure at least one option for MCQ
        }
        this.questionForm.get('correctAnswer')?.setValidators(Validators.required);
        this.options.controls.forEach(control => control.setValidators(Validators.required));
      } else {
        this.options.clear();
        this.questionForm.get('correctAnswer')?.clearValidators();
        this.options.controls.forEach(control => control.clearValidators());
      }
      this.questionForm.get('correctAnswer')?.updateValueAndValidity();
      this.options.updateValueAndValidity();
      this.cdr.detectChanges();
    });
  }

  get options(): FormArray<FormControl<string | null>> { // Strongly-typed FormArray
    return this.questionForm.get('options') as FormArray<FormControl<string | null>>;
  }

  addOption(): void {
    this.options.push(this.fb.control('', Validators.required));
  }

  removeOption(index: number): void {
    this.options.removeAt(index);
  }

  loadQuestions(): void {
    this.assessmentService.getQuestionsByAssessmentId(this.assessmentId).subscribe(
      (data: Question[]) => { // STRONGLY-TYPED DATA
        this.questions = data;
        this.cdr.detectChanges(); 
      },
      (error) => console.error('Error fetching questions', error)
    );
  }

  onSubmit(): void {
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      console.error('Form is invalid', this.questionForm.errors);
      return;
    }
    const formValue = this.questionForm.value;

    // --- Prepare values to match CreateQuestionDto ---
    // Ensure options are only sent for MCQ and are 'undefined' otherwise
    const optionsForDto = formValue.questionType === QuestionType.MCQ && formValue.options?.length > 0
                          ? formValue.options
                          : undefined; // Explicitly undefined if not MCQ or empty

    // Ensure correctAnswer is only sent for MCQ and is 'undefined' otherwise
    const correctAnswerForDto = formValue.questionType === QuestionType.MCQ && formValue.correctAnswer
                                ? formValue.correctAnswer
                                : undefined; // Explicitly undefined if not MCQ or empty

    // Ensure referenceFilePath is 'undefined' if empty/null
    const referenceFilePathForDto = formValue.referenceFilePath 
                                    ? formValue.referenceFilePath 
                                    : undefined; // Explicitly undefined if empty or null

    const questionToSave: CreateQuestionDto = { // Type this explicitly as CreateQuestionDto
      assessmentId: this.assessmentId,
      questionText: formValue.questionText,
      questionType: formValue.questionType,
      options: optionsForDto, // Use the prepared value
      correctAnswer: correctAnswerForDto, // Use the prepared value
      difficultyLevel: formValue.difficultyLevel,
      maxMarks: formValue.maxMarks,
      referenceFilePath: referenceFilePathForDto // Use the prepared value
    };
    
    if (this.isEditMode && this.selectedQuestionId) {
      // updateQuestion should also expect CreateQuestionDto or a specific UpdateQuestionDto
      // For now, assuming it takes CreateQuestionDto as well for simplicity
      this.assessmentService.updateQuestion(this.assessmentId, this.selectedQuestionId, questionToSave).subscribe(
        () => this.resetFormAndReload(),
        (error) => console.error('Error updating question', error)
      );
    } else {
      this.assessmentService.addQuestionToAssessment(this.assessmentId, questionToSave).subscribe(
        () => this.resetFormAndReload(),
        (error) => console.error('Error adding question', error)
      );
    }
  }

  onEdit(question: Question): void { // STRONGLY-TYPED INPUT
    this.isEditMode = true;
    this.selectedQuestionId = question.questionId;
    
    this.options.clear();
    if (question.questionType === QuestionType.MCQ && question.options && question.options.length > 0) {
      question.options.forEach((option: string) => {
        this.options.push(this.fb.control(option, Validators.required));
      });
    } else if (question.questionType === QuestionType.MCQ && question.options?.length === 0) {
        // If it's MCQ and no options, add a default one for editing
        this.addOption();
    }

    this.questionForm.patchValue({
      questionText: question.questionText,
      questionType: question.questionType,
      correctAnswer: question.correctAnswer,
      difficultyLevel: question.difficultyLevel,
      maxMarks: question.maxMarks,
      referenceFilePath: question.referenceFilePath
    });
    // Manually trigger valueChanges for the questionType to reapply validators for the new type
    this.questionForm.get('questionType')?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  onDelete(questionId: number): void {
    if (confirm('Are you sure you want to delete this question?')) {
      this.assessmentService.deleteQuestion(this.assessmentId, questionId).subscribe(
        () => this.loadQuestions(),
        (error) => console.error('Error deleting question', error)
      );
    }
  }

  resetFormAndReload(): void {
    this.questionForm.reset({
      questionType: QuestionType.MCQ, // Reset to default MCQ
      difficultyLevel: DifficultyLevel.Easy, // Reset to default Easy
      maxMarks: 1 // Reset to default max marks
    });
    this.options.clear();
    this.addOption(); // Add one option field by default for MCQ
    this.isEditMode = false;
    this.selectedQuestionId = null;
    this.loadQuestions();
  }
}