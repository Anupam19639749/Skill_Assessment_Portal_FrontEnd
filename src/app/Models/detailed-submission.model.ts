// src/app/Models/detailed-submission.model.ts

export interface DetailedSubmission {
  submissionId: number;
  userAssessmentId: number;
  questionId: number;
  questionText: string;
  answerText: string | null; // User's submitted answer text
  answerFilePath: string | null; // Path to file if it was a file-based answer
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  correctAnswer: string | null; // The correct answer text
  submittedAt: Date; // Date when this specific answer was submitted
  feedback?: string | null; // Optional: If evaluators provide feedback per question
}