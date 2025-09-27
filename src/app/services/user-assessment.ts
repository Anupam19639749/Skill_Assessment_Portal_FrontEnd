import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';
import {AssignAssessmentPayload, UserAssessments } from '../Models/user-assessment.model';
import { DetailedSubmission } from '../Models/detailed-submission.model';

@Injectable({
  providedIn: 'root'
})
// NOTE: Class name is 'UserAssessment', we'll keep it as per your code.
export class UserAssessment {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  /**
   * Admin/Evaluator endpoint to assign assessments to users.
   * Uses AssignAssessmentPayload for the body and expects a generic response.
   * @param assessmentId The ID of the assessment.
   * @param userIds An array of user IDs to assign.
   * @param scheduledAt The scheduled date and time for the assessment.
   */
  assignAssessmentToUsers(
    assessmentId: number,
    userIds: number[],
    scheduledAt: Date // Changed from string to Date
  ): Observable<{ message: string }> { // Assuming backend returns { message: "..." } on success
    const body: AssignAssessmentPayload = { assessmentId, userIds, scheduledAt }; 
    return this.http.post<{ message: string }>(`${this.apiUrl}/userassessments/assign`, body);
  }

  /**
   * Candidate endpoint to get their assigned assessments.
   * Returns UserAssessments[]
   * @param userId The ID of the candidate.
   */
  getUserAssessments(userId: number): Observable<UserAssessments[]> {
    return this.http.get<UserAssessments[]>(`${this.apiUrl}/userassessments/${userId}/user`);
  }

  /**
   * Retrieves all user assessments for a specific assessment.
   * Returns UserAssessments[]
   * @param assessmentId The ID of the assessment.
   */
  getAllUserAssessmentsByAssessmentId(assessmentId: number): Observable<UserAssessments[]> {
    return this.http.get<UserAssessments[]>(`${this.apiUrl}/userassessments/${assessmentId}/assessment`);
  }

  /**
   * Admin/Evaluator endpoint to get all user assessments across all users and assessments.
   * Returns UserAssessments[]
   */
  getAllUserAssessments(): Observable<UserAssessments[]> {
    return this.http.get<UserAssessments[]>(`${this.apiUrl}/userassessments`);
  }

  /**
   * Candidate endpoint to get a single user assessment's details by ID.
   * Returns a single UserAssessments object.
   * @param userAssessmentId The ID of the specific user-assessment record.
   */
  getUserAssessmentDetails(userAssessmentId: number): Observable<UserAssessments> {
    return this.http.get<UserAssessments>(`${this.apiUrl}/userassessments/${userAssessmentId}`);
  }

  /**
   * Candidate endpoint to start an assessment.
   * Expects a success message or confirmation.
   * @param userAssessmentId The ID of the user-assessment to start.
   */
  startAssessment(userAssessmentId: number): Observable<{ message: string }> { // Assuming a message response
    return this.http.post<{ message: string }>(`${this.apiUrl}/userassessments/${userAssessmentId}/start`, {});
  }

  /**
   * Candidate endpoint to submit an assessment.
   * Expects a success message or confirmation.
   * @param userAssessmentId The ID of the user-assessment to submit.
   */
  submitAssessment(userAssessmentId: number): Observable<{ message: string }> { // Assuming a message response
    return this.http.post<{ message: string }>(`${this.apiUrl}/userassessments/${userAssessmentId}/submit`, {});
  }

  /**
   * Admin/Evaluator endpoint to unassign an assessment from a user.
   * Expects no content (void) on successful deletion.
   * @param userAssessmentId The ID of the specific user-assessment record to unassign.
   */
  unassignAssessment(userAssessmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/userassessments/${userAssessmentId}`);
  }

  // --- NEW METHOD: To get detailed submission results for a user assessment ---
  getDetailedSubmissionResults(userAssessmentId: number): Observable<DetailedSubmission[]> {
    return this.http.get<DetailedSubmission[]>(`${this.apiUrl}/Submissions/by-user-assessment/${userAssessmentId}`);
  }
}