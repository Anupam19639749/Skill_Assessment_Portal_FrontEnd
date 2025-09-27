// Match the backend enum values (0 = NotStarted, 1 = InProgress, etc.)
export enum UserAssessmentStatus {
  NotStarted = 0,
  InProgress = 1,
  Submitted = 2,
  Evaluated = 3,
  Completed = 4
}

export interface UserAssessments { // Changed from UserAssessment to UserAssessments
  userAssessmentId: number;
  userId: number;
  userName: string;
  email: string; // Added for easier display in lists
  assessmentId: number;
  assessmentTitle: string;
  durationMinutes: number;
  status: UserAssessmentStatus; // Use the enum
  scheduledAt: Date; // ISO string from backend will be converted to Date by HttpClient
  startedAt?: Date | null; // Optional, can be null
  submittedAt?: Date | null; // Optional, can be null
  totalMarksObtained?: number | null; // Optional, can be null
  percentage?: number | null; // Optional, can be null
  passed?: boolean | null; // Optional, can be null
  feedback?: string | null; // Optional, can be null
}

// Payload for assigning assessments
export interface AssignAssessmentPayload { 
  assessmentId: number;
  userIds: number[];
  scheduledAt: Date; // Send as ISO string, TypeScript Date object works
}

// // Example: Interface for a submission (if you have one later)
// export interface UserSubmission {
//   userAssessmentId: number;
//   questionId: number;
//   answerText?: string;
//   submittedFilePath?: string;
//   marksObtained?: number;
// }