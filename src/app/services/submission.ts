import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';
import { UserSubmission } from '../Models/user-submission.model';

@Injectable({
  providedIn: 'root'
})
export class Submission {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  /**
   * Saves or updates a single answer/submission for a question.
   * @param submission The submission data (UserAssessmentId, QuestionId, AnswerText).
   */
  createOrUpdateSubmission(submission: UserSubmission): Observable<any> { 
    // Assuming backend POST /api/submissions handles both create/update based on unique constraint
    return this.http.post(`${this.apiUrl}/submissions`, submission); 
  }

  /**
   * Retrieves all saved submissions for a specific test attempt (userAssessment).
   * @param userAssessmentId ID of the user's test attempt.
   */
  getSubmissionsByUserAssessmentId(userAssessmentId: number): Observable<UserSubmission[]> {
    return this.http.get<UserSubmission[]>(`${this.apiUrl}/submissions/by-user-assessment/${userAssessmentId}`);
  }
}
