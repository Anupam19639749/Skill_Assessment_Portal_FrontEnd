import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';


@Injectable({
  providedIn: 'root'
})
export class UserAssessment {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  // Admin/Evaluator endpoint to assign assessments to users
  assignAssessmentToUsers(assessmentId: number, userIds: number[], scheduledAt: string): Observable<any> {
    const body = { assessmentId, userIds, scheduledAt }; 
    return this.http.post(`${this.apiUrl}/userassessments/assign`, body);
  }

  // Candidate endpoint to get their assigned assessments
  getUserAssessments(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/userassessments?userId=${userId}`);
  }

  getAllUserAssessmentsByAssessmentId(assessmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/userassessments?assessmentId=${assessmentId}`);
  }

  // Admin/Evaluator endpoint to get all user assessments
  getAllUserAssessments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/userassessments`);
  }

  // Candidate endpoint to get a single user assessment by ID
  getUserAssessmentDetails(userAssessmentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/userassessments/${userAssessmentId}`);
  }

  // Candidate endpoint to start an assessment
  startAssessment(userAssessmentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/userassessments/${userAssessmentId}/start`, {});
  }

  // Candidate endpoint to submit an assessment
  submitAssessment(userAssessmentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/userassessments/${userAssessmentId}/submit`, {});
  }

  unassignAssessment(userAssessmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/userassessments/${userAssessmentId}`);
  } 
}
