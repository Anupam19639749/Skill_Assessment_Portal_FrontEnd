import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  // --- Assessment Endpoints ---

  getAllAssessments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assessments`);
  }

  getAssessmentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/assessments/${id}`);
  }

  createAssessment(assessment: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assessments`, assessment);
  }

  updateAssessment(id: number, assessment: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/assessments/${id}`, assessment);
  }

  // --- Question Endpoints ---

  getQuestionsByAssessmentId(assessmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assessments/${assessmentId}/questions`);
  }

  addQuestionToAssessment(assessmentId: number, question: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assessments/${assessmentId}/questions`, question);
  }

  updateQuestion(assessmentId: number, questionId: number, question: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/assessments/${assessmentId}/questions/${questionId}`, question);
  }

  deleteQuestion(assessmentId: number, questionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/assessments/${assessmentId}/questions/${questionId}`);
  }

}
