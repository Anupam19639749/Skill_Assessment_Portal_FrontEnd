import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class Result {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  /**
   * Retrieves the final result for a completed user assessment.
   * @param userAssessmentId ID of the user's test attempt.
   */
  getResultByUserAssessmentId(userAssessmentId: number): Observable<any> { 
    return this.http.get(`${this.apiUrl}/results/${userAssessmentId}`);
  }

}
