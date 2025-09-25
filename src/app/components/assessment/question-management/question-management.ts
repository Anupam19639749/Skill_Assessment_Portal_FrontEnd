import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssessmentService } from '../../../services/assessment-service';

@Component({
  selector: 'app-question-management',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './question-management.html',
  styleUrl: './question-management.css'
})
export class QuestionManagement implements OnInit{
  assessmentId!: number;
  questions: any[] = [];
  questionForm!: FormGroup;
  isEditMode = false;
  selectedQuestionId: number | null = null;
  questionTypes = ['MCQ', 'Descriptive', 'Coding', 'FileUpload'];
  difficultyLevels = ['Easy', 'Medium', 'Hard'];

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
      questionType: [0, Validators.required], // 0 corresponds to MCQ
      options: this.fb.array([]),
      correctAnswer: ['', Validators.required],
      difficultyLevel: [0, Validators.required], // 0 corresponds to Easy
      maxMarks: [1, [Validators.required, Validators.min(1)]]
    });
    this.addOption(); // Add one option field by default
  }

  get options(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  addOption(): void {
    this.options.push(this.fb.control('', Validators.required));
  }

  removeOption(index: number): void {
    this.options.removeAt(index);
  }

  loadQuestions(): void {
    this.assessmentService.getQuestionsByAssessmentId(this.assessmentId).subscribe(
      (data) => {
        this.questions = data,
        this.cdr.detectChanges(); 
      },
      (error) => console.error('Error fetching questions', error)
    );
  }

  onSubmit(): void {
    if (this.questionForm.invalid) {
      return;
    }
    const formValue = this.questionForm.value;
    const questionToSave = {
      ...formValue,
      questionType: formValue.questionType,
      difficultyLevel: formValue.difficultyLevel,
      options: this.questionForm.get('options')?.value // Ensure options are included
    };
    
    if (this.isEditMode && this.selectedQuestionId) {
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

  onEdit(question: any): void {
    this.isEditMode = true;
    this.selectedQuestionId = question.questionId;
    
    // Clear existing options and add new ones from the question
    this.options.clear();
    if (question.options) {
      question.options.forEach((option: string) => {
        this.options.push(this.fb.control(option, Validators.required));
      });
    }

    this.questionForm.patchValue({
      questionText: question.questionText,
      questionType: question.questionType,
      correctAnswer: question.correctAnswer,
      difficultyLevel: question.difficultyLevel,
      maxMarks: question.maxMarks
    });
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
    this.questionForm.reset();
    this.options.clear();
    this.addOption();
    this.isEditMode = false;
    this.selectedQuestionId = null;
    this.loadQuestions();
  }
}
