import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserAssessment } from '../../../services/user-assessment';
import { AssessmentService } from '../../../services/assessment-service';
import { Submission } from '../../../services/submission';
import { Auth } from '../../../services/auth';
import { NavigationService } from '../../../services/navigation.service'; // Import navigation service

import { UserAssessments, UserAssessmentStatus } from '../../../Models/user-assessment.model';
import { Question, QuestionType } from '../../../Models/assessment.model';
import { UserSubmission } from '../../../Models/user-submission.model';

interface AssessmentState {
  timeLeftSeconds: number;
  currentQuestionIndex: number;
  answers: { [questionId: number]: string };
  lastSaved: number;
}

@Component({
  selector: 'app-take-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './take-assessment.html',
  styleUrl: './take-assessment.css'
})
export class TakeAssessment implements OnInit, OnDestroy {
  userAssessmentId!: number;
  userAssessment!: UserAssessments;
  
  questions: Question[] = [];
  answers: { [questionId: number]: string } = {};
  questionStatus: { [questionId: number]: 'answered' | 'unanswered' | 'flagged' } = {};
  
  currentQuestionIndex: number = 0;
  currentAnswer: string = '';
  
  timeLeftSeconds: number = 0;
  timerSubscription!: Subscription;
  autoSaveSubscription!: Subscription;
  
  isTestActive: boolean = false;
  isLoading: boolean = true;
  isSaving: boolean = false;
  lastAutoSave: Date | null = null;
  
  // Storage keys
  private readonly STORAGE_KEY = 'assessment_state_';
  private readonly HEARTBEAT_KEY = 'assessment_heartbeat_';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userAssessmentService: UserAssessment,
    private assessmentService: AssessmentService,
    private submissionService: Submission,
    private authService: Auth,
    private navigationService: NavigationService, // Inject navigation service
    private cdr: ChangeDetectorRef
  ) { }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    if (this.isTestActive) {
      this.saveAssessmentState();
      event.returnValue = 'Your assessment progress will be saved, but you may lose some recent changes.';
    }
  }

  @HostListener('window:unload')
  unloadHandler() {
    if (this.isTestActive) {
      this.saveAssessmentState();
    }
  }

  ngOnInit(): void {
    // Hide navigation when assessment starts
    this.navigationService.hideNavigation();
    
    this.route.params.subscribe(params => {
      this.userAssessmentId = +params['userAssessmentId'];
      this.loadTestDetails();
    });
  }

  ngOnDestroy(): void {
    // Show navigation when component is destroyed
    this.navigationService.showNavigation();
    this.cleanup();
  }

  private cleanup(): void {
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
    if (this.autoSaveSubscription) this.autoSaveSubscription.unsubscribe();
    
    if (this.isTestActive) {
      this.saveCurrentAnswer();
      this.saveAssessmentState();
    }
  }

  // --- STATE PERSISTENCE ---
  private saveAssessmentState(): void {
    if (!this.isTestActive) return;
    
    const state: AssessmentState = {
      timeLeftSeconds: this.timeLeftSeconds,
      currentQuestionIndex: this.currentQuestionIndex,
      answers: this.answers,
      lastSaved: Date.now()
    };
    
    try {
      localStorage.setItem(this.STORAGE_KEY + this.userAssessmentId, JSON.stringify(state));
      localStorage.setItem(this.HEARTBEAT_KEY + this.userAssessmentId, Date.now().toString());
    } catch (error) {
      console.warn('Could not save assessment state to localStorage');
    }
  }

  private loadAssessmentState(): AssessmentState | null {
    try {
      const stateStr = localStorage.getItem(this.STORAGE_KEY + this.userAssessmentId);
      const heartbeatStr = localStorage.getItem(this.HEARTBEAT_KEY + this.userAssessmentId);
      
      if (!stateStr || !heartbeatStr) return null;
      
      const lastHeartbeat = parseInt(heartbeatStr);
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;
      
      // If more than 5 minutes since last heartbeat, consider state stale
      if (timeSinceLastHeartbeat > 5 * 60 * 1000) {
        this.clearAssessmentState();
        return null;
      }
      
      return JSON.parse(stateStr);
    } catch (error) {
      console.warn('Could not load assessment state from localStorage');
      return null;
    }
  }

  private clearAssessmentState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY + this.userAssessmentId);
      localStorage.removeItem(this.HEARTBEAT_KEY + this.userAssessmentId);
    } catch (error) {
      console.warn('Could not clear assessment state from localStorage');
    }
  }

  // --- INITIALIZATION ---
  loadTestDetails(): void {
    this.isLoading = true;
    
    this.userAssessmentService.getUserAssessmentDetails(this.userAssessmentId).subscribe({
      next: (ua: UserAssessments) => {
        this.userAssessment = ua;
        
        if (ua.status === UserAssessmentStatus.Submitted) {
          alert('This assessment has already been submitted.');
          this.router.navigate(['/home']);
          return;
        }

        if (ua.status === UserAssessmentStatus.NotStarted) {
          this.startAssessmentOnBackend();
        } else {
          this.initializeTest();
        }
      },
      error: (err) => {
        console.error('Failed to load assessment details:', err);
        alert('Failed to load assessment details.');
        this.router.navigate(['/home']);
      }
    });
  }

  startAssessmentOnBackend(): void {
    this.userAssessmentService.startAssessment(this.userAssessmentId).subscribe({
      next: () => {
        this.userAssessment.status = UserAssessmentStatus.InProgress;
        this.initializeTest();
      },
      error: (err) => {
        console.error('Cannot start assessment:', err);
        alert('Cannot start assessment. Check schedule or contact administrator.');
        this.router.navigate(['/home']);
      }
    });
  }
  
  initializeTest(): void {
    this.loadQuestionsAndSubmissions();
  }

  loadQuestionsAndSubmissions(): void {
    this.assessmentService.getQuestionsByAssessmentId(this.userAssessment.assessmentId).subscribe({
      next: (questions: Question[]) => {
        this.questions = questions;
        
        // Initialize question status
        this.questions.forEach(q => {
          this.questionStatus[q.questionId] = 'unanswered';
        });
        
        this.submissionService.getSubmissionsByUserAssessmentId(this.userAssessmentId).subscribe({
          next: (submissions: UserSubmission[]) => {
            // Load existing answers
            submissions.forEach(sub => {
              if (sub.answerText) {
                this.answers[sub.questionId] = sub.answerText;
                this.questionStatus[sub.questionId] = 'answered';
              }
            });
            
            // Try to restore state from localStorage
            const savedState = this.loadAssessmentState();
            if (savedState) {
              this.timeLeftSeconds = Math.max(0, savedState.timeLeftSeconds);
              this.currentQuestionIndex = Math.min(savedState.currentQuestionIndex, this.questions.length - 1);
              
              // Merge saved answers with server answers (server takes precedence for conflicts)
              Object.keys(savedState.answers).forEach(questionIdStr => {
                const questionId = parseInt(questionIdStr);
                if (!this.answers[questionId]) {
                  this.answers[questionId] = savedState.answers[questionId];
                  if (savedState.answers[questionId]) {
                    this.questionStatus[questionId] = 'answered';
                  }
                }
              });
            } else {
              // First time or state expired - use full duration
              this.timeLeftSeconds = this.userAssessment.durationMinutes * 60;
            }
            
            this.loadCurrentAnswer();
            this.startTest();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Could not load submissions:', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Could not load questions:', err);
        alert('Could not load questions.');
        this.router.navigate(['/home']);
      }
    });
  }

  private startTest(): void {
    this.isTestActive = true;
    this.startTimer();
    this.startAutoSave();
  }

  // --- TIMER ---
  startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeLeftSeconds = Math.max(0, this.timeLeftSeconds - 1);
      
      // Save state periodically (every 30 seconds)
      if (this.timeLeftSeconds % 30 === 0) {
        this.saveAssessmentState();
      }
      
      if (this.timeLeftSeconds <= 0) {
        this.autoSubmitTest();
      }
      
      this.cdr.detectChanges();
    });
  }

  private startAutoSave(): void {
    // Auto-save every 2 minutes
    this.autoSaveSubscription = interval(120000).subscribe(() => {
      this.saveCurrentAnswer(true);
    });
  }
  
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const pad = (n: number) => n < 10 ? '0' + n : n;
    
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    }
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  }
  
  // --- NAVIGATION AND ANSWER MANAGEMENT ---
  loadCurrentAnswer(): void {
    if (this.questions.length === 0) return;
    
    const currentQuestion = this.questions[this.currentQuestionIndex];
    this.currentAnswer = this.answers[currentQuestion.questionId] || '';
  }

  saveCurrentAnswer(isAutoSave: boolean = false): void {
    if (!this.isTestActive || this.isSaving) return;

    const currentQuestion = this.questions[this.currentQuestionIndex];
    
    // Update local state immediately
    this.answers[currentQuestion.questionId] = this.currentAnswer;
    this.questionStatus[currentQuestion.questionId] = this.currentAnswer.trim() ? 'answered' : 'unanswered';
    this.saveAssessmentState();
    
    // Save to server
    this.isSaving = true;
    const submissionPayload: UserSubmission = {
      userAssessmentId: this.userAssessmentId,
      questionId: currentQuestion.questionId,
      answerText: this.currentAnswer,
    };
    
    this.submissionService.createOrUpdateSubmission(submissionPayload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.lastAutoSave = new Date();
        
        if (!isAutoSave) {
          this.showTemporaryMessage('Answer saved!', 2000);
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to save answer:', err);
        this.isSaving = false;
        
        if (!isAutoSave) {
          this.showTemporaryMessage('Failed to save answer. Please try again.', 3000, true);
        }
      }
    });
  }

  changeQuestion(step: number): void {
    // Save current answer before moving
    this.saveCurrentAnswer();
    
    // Update index
    const newIndex = this.currentQuestionIndex + step;
    if (newIndex >= 0 && newIndex < this.questions.length) {
      this.currentQuestionIndex = newIndex;
      this.loadCurrentAnswer();
    }
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.questions.length && index !== this.currentQuestionIndex) {
      this.saveCurrentAnswer();
      this.currentQuestionIndex = index;
      this.loadCurrentAnswer();
    }
  }

  flagQuestion(): void {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    const currentStatus = this.questionStatus[currentQuestion.questionId];
    
    this.questionStatus[currentQuestion.questionId] = 
      currentStatus === 'flagged' ? 
        (this.currentAnswer.trim() ? 'answered' : 'unanswered') : 
        'flagged';
    
    this.saveAssessmentState();
  }

  // --- UTILITY METHODS ---
  private showTemporaryMessage(message: string, duration: number, isError: boolean = false): void {
    // You can implement a toast notification service here
    // For now, using console.log, but you should replace with proper toast
    if (isError) {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  getQuestionStatusIcon(questionIndex: number): string {
    const question = this.questions[questionIndex];
    const status = this.questionStatus[question.questionId];
    
    switch (status) {
      case 'answered': return '✓';
      case 'flagged': return '🚩';
      default: return '';
    }
  }

  getAnsweredCount(): number {
    return Object.values(this.questionStatus).filter(status => status === 'answered').length;
  }

  getFlaggedCount(): number {
    return Object.values(this.questionStatus).filter(status => status === 'flagged').length;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  }

  // --- SUBMISSION ---
  autoSubmitTest(): void {
    this.saveCurrentAnswer();
    this.finalSubmit(true);
  }
  
  finalSubmit(isTimeOut: boolean = false): void {
    if (!this.isTestActive) return;
    
    const unansweredCount = this.questions.length - this.getAnsweredCount();
    
    if (!isTimeOut) {
      let confirmMessage = `Are you sure you want to submit the assessment?\n\n`;
      confirmMessage += `Answered: ${this.getAnsweredCount()}/${this.questions.length}\n`;
      if (unansweredCount > 0) {
        confirmMessage += `Unanswered: ${unansweredCount}\n`;
      }
      confirmMessage += `\nYou cannot return to it after submission.`;
      
      if (!confirm(confirmMessage)) {
        return;
      }
    }
    
    // Final save
    this.saveCurrentAnswer();
    this.isTestActive = false;

    this.userAssessmentService.submitAssessment(this.userAssessmentId).subscribe({
      next: () => {
        this.clearAssessmentState();
        // Show navigation before redirecting
        this.navigationService.showNavigation();
        alert('Assessment submitted successfully! Results will be available soon.');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Submission failed:', err);
        alert('Submission failed. Please try again.');
        this.isTestActive = true;
      }
    });
  }
}