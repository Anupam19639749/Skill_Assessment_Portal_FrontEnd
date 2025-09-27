// Match the backend enum values (0, 1, 2, 3...)
export enum QuestionType {
  MCQ = 0,
  Descriptive = 1,
  Coding = 2,
  FileUpload = 3
}

export enum DifficultyLevel {
  Easy = 0,
  Medium = 1,
  Hard = 2
}

export interface Assessment {
  assessmentId: number;
  title: string;
  description: string | null; // Can be null
  durationMinutes: number;
  createdBy: number;
  creatorName: string;
  // scheduledAt: Date; // This is for UserAssessment, not the base Assessment definition itself
  instructionsFilePath: string | null; // Can be null
  createdAt: Date;
  questionCount: number;
}

export interface Question {
  questionId: number;
  assessmentId: number;
  questionText: string;
  questionType: QuestionType;
  options: string[] | null; // Assuming JSON serialization returns null for non-MCQ.
  correctAnswer: string | null; // Can be null for descriptive/file upload types
  difficultyLevel: DifficultyLevel;
  maxMarks: number;
  referenceFilePath: string | null; // Can be null
}

// If you have DTOs for creating/updating assessments/questions, add them here.
export interface CreateAssessmentDto {
  title: string;
  description: string;
  durationMinutes: number;
  instructionsFilePath?: string;
}

export interface CreateQuestionDto {
  assessmentId: number;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer?: string;
  difficultyLevel: DifficultyLevel;
  maxMarks: number;
  referenceFilePath?: string;
}