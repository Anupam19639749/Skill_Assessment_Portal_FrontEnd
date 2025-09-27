import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';
import { Assessment, Question, CreateAssessmentDto, CreateQuestionDto } from '../Models/assessment.model';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  // --- Assessment Endpoints ---

  /**
   * Retrieves a list of all assessments.
   * Returns Assessment[]
   */
  getAllAssessments(): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(`${this.apiUrl}/assessments`);
  }

  /**
   * Retrieves a single assessment by ID.
   * Returns Assessment
   * @param id The ID of the assessment.
   */
  getAssessmentById(id: number): Observable<Assessment> {
    return this.http.get<Assessment>(`${this.apiUrl}/assessments/${id}`);
  }

  /**
   * Creates a new assessment.
   * Uses CreateAssessmentDto for the request body.
   * Returns the created Assessment.
   * @param assessment The assessment data to create.
   */
  createAssessment(assessment: CreateAssessmentDto): Observable<Assessment> { // Typed to CreateAssessmentDto
    return this.http.post<Assessment>(`${this.apiUrl}/assessments`, assessment);
  }

  /**
   * Updates an existing assessment.
   * Uses CreateAssessmentDto (or a specific UpdateAssessmentDto if properties differ) for the request body.
   * Returns the updated Assessment.
   * @param id The ID of the assessment to update.
   * @param assessment The updated assessment data.
   */
  updateAssessment(id: number, assessment: CreateAssessmentDto): Observable<Assessment> { // Typed to CreateAssessmentDto
    return this.http.put<Assessment>(`${this.apiUrl}/assessments/${id}`, assessment);
  }

  // --- Question Endpoints ---

  /**
   * Retrieves all questions for a specific assessment.
   * Returns Question[]
   * @param assessmentId The ID of the assessment.
   */
  getQuestionsByAssessmentId(assessmentId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/assessments/${assessmentId}/questions`);
  }

  /**
   * Adds a new question to an assessment.
   * Uses CreateQuestionDto for the request body.
   * Returns the created Question.
   * @param assessmentId The ID of the assessment to add the question to.
   * @param question The question data to create.
   */
  addQuestionToAssessment(assessmentId: number, question: CreateQuestionDto): Observable<Question> { // Typed to CreateQuestionDto
    return this.http.post<Question>(`${this.apiUrl}/assessments/${assessmentId}/questions`, question);
  }

  /**
   * Updates an existing question.
   * Uses CreateQuestionDto (or a specific UpdateQuestionDto if properties differ) for the request body.
   * Returns the updated Question.
   * @param assessmentId The ID of the assessment the question belongs to.
   * @param questionId The ID of the question to update.
   * @param question The updated question data.
   */
  updateQuestion(assessmentId: number, questionId: number, question: CreateQuestionDto): Observable<Question> { // Typed to CreateQuestionDto
    return this.http.put<Question>(`${this.apiUrl}/assessments/${assessmentId}/questions/${questionId}`, question);
  }

  /**
   * Deletes a question from an assessment.
   * Returns void (or a success message if the backend sends one).
   * @param assessmentId The ID of the assessment the question belongs to.
   * @param questionId The ID of the question to delete.
   */
  deleteQuestion(assessmentId: number, questionId: number): Observable<void> { // Changed return type to void
    return this.http.delete<void>(`${this.apiUrl}/assessments/${assessmentId}/questions/${questionId}`);
  }
}