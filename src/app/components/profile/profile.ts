import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Users } from '../../Models/user.model';
import { User } from '../../services/user';
import { Auth } from '../../services/auth';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  user: Users | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  isEditMode: boolean = false; // To toggle between view and edit
  
  successMessage: string | null = null;
  errorMessage: string | null = null;
  
  genderOptions: string[] = ['Male', 'Female', 'Other'];
  qualificationOptions: string[] = ['High School', 'Associate Degree', 'Bachelors Degree', 'Masters Degree', 'PhD'];

  constructor(
    private fb: FormBuilder,
    private userService: User, 
    private authService: Auth
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
  }

  initForms(): void {
    // Editable profile form
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      profilePicturePath: [''], // For URL input
      gender: [''],
      highestQualification: [''],
      isEmployed: [false],
      currentRole: [''] // Optional, will be validated based on isEmployed
    });

    // Password change form
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Add conditional validation for currentRole
    this.profileForm.get('isEmployed')?.valueChanges.subscribe(isEmployed => {
      const currentRoleControl = this.profileForm.get('currentRole');
      if (isEmployed) {
        currentRoleControl?.setValidators(Validators.required);
      } else {
        currentRoleControl?.clearValidators();
      }
      currentRoleControl?.updateValueAndValidity();
    });
  }

  loadUserProfile(): void {
    this.clearMessages();
    const userId = this.getUserIdFromToken();
    if (userId) {
      this.userService.getUserById(userId).subscribe({
        next: (data: Users) => {
          this.user = data;
          this.profileForm.patchValue(data);
        },
        error: (err) => {
          console.error('Failed to load profile data', err);
          this.errorMessage = 'Failed to load profile data.';
        }
      });
    }
  }

  // Custom validator for password matching
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPass = control.get('newPassword');
    const confirmPass = control.get('confirmPassword');
    
    if (!newPass || !confirmPass || !newPass.value || !confirmPass.value) {
      return null;
    }
    if (newPass.value !== confirmPass.value) {
      confirmPass.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      confirmPass.setErrors(null);
      return null;
    }
  }

  onProfileSubmit(): void {
    this.clearMessages();
    this.profileForm.markAllAsTouched();
    
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please correct the errors in the profile form.';
      return;
    }
    
    const userId = this.getUserIdFromToken();
    if (userId) {
      this.userService.updateUserProfile(userId, this.profileForm.value).subscribe({
        next: () => {
          this.successMessage = 'Profile updated successfully!';
          this.isEditMode = false; // Exit edit mode
          this.loadUserProfile(); // Reload to reflect changes
        },
        error: (err) => {
          console.error('Profile update failed', err);
          this.errorMessage = err.error?.message || 'Failed to update profile.';
        }
      });
    }
  }

  onPasswordSubmit(): void {
    this.clearMessages();
    this.passwordForm.markAllAsTouched();

    if (this.passwordForm.invalid) {
      this.errorMessage = 'Please correct the errors in the password form.';
      return;
    }
    
    const userId = this.getUserIdFromToken();
    if (userId) {
      const { currentPassword, newPassword } = this.passwordForm.value;
      this.userService.changeUserPassword(userId, { currentPassword, newPassword }).subscribe({
        next: () => {
          this.successMessage = 'Password changed successfully!';
          this.passwordForm.reset();
        },
        error: (err) => {
          console.error('Password change failed', err);
          this.errorMessage = err.error?.message || 'Failed to change password. Check your current password.';
        }
      });
    }
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.clearMessages();
    if (this.isEditMode && this.user) {
      // If entering edit mode, ensure form values are up-to-date
      this.profileForm.patchValue(this.user);
    } else {
      // If exiting edit mode without saving, reset form to original values
      this.loadUserProfile(); 
    }
  }

  private getUserIdFromToken(): number | null {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        const userIdClaim = decodedToken.nameid || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        return userIdClaim ? +userIdClaim : null;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  clearMessages(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }
}
