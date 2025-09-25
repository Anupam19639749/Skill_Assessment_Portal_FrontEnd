import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class User {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  /**
   * Retrieves a list of all users from the backend.
   * This is an admin/evaluator-only endpoint.
   */
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  /**
   * Updates a user's role.
   * This is an admin-only endpoint.
   * @param userId The ID of the user to update.
   * @param newRoleId The ID of the new role.
   */
  updateUserRole(userId: number, newRoleId: number): Observable<void> {
    const body = { newRoleId: newRoleId }; 
    return this.http.put<void>(`${this.apiUrl}/users/${userId}/role`, body);
  }

  /**
   * Deletes a user.
   * This is an admin-only endpoint.
   * @param userId The ID of the user to delete.
   */
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Retrieves a single user's details by ID.
   * This can be used for a user's own profile or by an admin.
   * @param userId The ID of the user to retrieve.
   */
  getUserById(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}`);
  }
}
