import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';
import { Users, UserProfileUpdate, UserPasswordUpdate } from '../Models/user.model';

@Injectable({
  providedIn: 'root'
})
// NOTE: Class name is 'User', we'll keep it as per your code.
export class User { 
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  /**
   * Retrieves a list of all users from the backend.
   * Uses Users[] interface.
   */
  getAllUsers(): Observable<Users[]> {
    return this.http.get<Users[]>(`${this.apiUrl}/users`);
  }

  /**
   * Updates a user's role.
   * No type change needed for this method.
   */
  updateUserRole(userId: number, newRoleId: number): Observable<void> {
    const body = { newRoleId: newRoleId }; 
    return this.http.put<void>(`${this.apiUrl}/users/${userId}/role`, body);
  }

  /**
   * Deletes a user.
   * No type change needed for this method.
   */
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Retrieves a single user's details by ID.
   * FIX: Changed Observable<User> to Observable<Users> (the model interface).
   */
  getUserById(userId: number): Observable<Users> { 
    return this.http.get<Users>(`${this.apiUrl}/users/${userId}`);
  }

   updateUserProfile(userId: number, profileData: UserProfileUpdate): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/${userId}/profile`, profileData);
  }

  changeUserPassword(userId: number, passwordData: UserPasswordUpdate): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/${userId}/password`, passwordData);
  }
}