export interface UserSubmission {
    userAssessmentId: number; 
    questionId: number; 

    answerText?: string | null;
    answerFilePath?: string | null;

    submissionId?: number; // Primary key, returned by API on creation
    isCorrect?: boolean | null;
    marksObtained?: number | null;
    submittedAt?: Date;
}