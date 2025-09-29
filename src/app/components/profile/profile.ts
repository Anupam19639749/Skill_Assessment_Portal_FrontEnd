import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
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
export class Profile implements OnInit {
  user: Users | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  isEditMode: boolean = false;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  isUploading: boolean = false;
  
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
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      profilePicturePath: [''],
      gender: [''],
      highestQualification: [''],
      isEmployed: [false],
      currentRole: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Conditional validation for currentRole
    this.profileForm.get('isEmployed')?.valueChanges.subscribe(isEmployed => {
      const currentRoleControl = this.profileForm.get('currentRole');
      if (isEmployed) {
        currentRoleControl?.setValidators([Validators.required, Validators.minLength(2)]);
      } else {
        currentRoleControl?.clearValidators();
        currentRoleControl?.setValue('');
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
          // Set image preview to current profile picture
          this.imagePreviewUrl = data.profilePicturePath || null;
        },
        error: (err) => {
          console.error('Failed to load profile data', err);
          this.errorMessage = 'Failed to load profile data.';
        }
      });
    }
  }

  // File upload handling
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Please select a valid image file.';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Image size must be less than 5MB.';
        return;
      }

      this.selectedFile = file;
      this.clearMessages();

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreviewUrl = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onImageDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  removeSelectedImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = this.user?.profilePicturePath || null;
  }

  // Upload image and get path
  private async uploadImage(): Promise<string | null> {
    if (!this.selectedFile) return null;

    try {
      this.isUploading = true;
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = this.selectedFile.name.split('.').pop();
      const fileName = `profile_${this.getUserIdFromToken()}_${timestamp}.${fileExtension}`;
      
      // For now, we'll simulate saving to public/images/ folder
      const imagePath = `/images/${fileName}`;
      
      return imagePath;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image');
    } finally {
      this.isUploading = false;
    }
  }

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

  async onProfileSubmit(): Promise<void> {
    this.clearMessages();
    this.profileForm.markAllAsTouched();
    
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please correct the errors in the form.';
      return;
    }
    
    const userId = this.getUserIdFromToken();
    if (userId) {
      try {
        let profileData = { ...this.profileForm.value };
        
        // Handle image upload if new image selected
        if (this.selectedFile) {
          const imagePath = await this.uploadImage();
          if (imagePath) {
            profileData.profilePicturePath = imagePath;
          }
        }
        
        this.userService.updateUserProfile(userId, profileData).subscribe({
          next: () => {
            this.successMessage = 'Profile updated successfully!';
            this.isEditMode = false;
            this.selectedFile = null;
            this.loadUserProfile();
          },
          error: (err) => {
            console.error('Profile update failed', err);
            this.errorMessage = err.error?.message || 'Failed to update profile.';
          }
        });
      } catch (error) {
        this.errorMessage = 'Failed to upload image. Please try again.';
      }
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
    if (this.isEditMode) {
      // Cancel editing - reset form and image
      this.loadUserProfile();
      this.selectedFile = null;
      this.imagePreviewUrl = this.user?.profilePicturePath || null;
    } else {
      // Enter edit mode
      if (this.user) {
        this.profileForm.patchValue(this.user);
        this.imagePreviewUrl = this.user.profilePicturePath || null;
      }
    }
    this.isEditMode = !this.isEditMode;
    this.clearMessages();
  }

  getCurrentProfileImage(): string {
    if (this.imagePreviewUrl) {
      return this.imagePreviewUrl;
    }
    return this.user?.profilePicturePath || '/images/default-profile.png';
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