import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core';
import { User } from '../../services/user';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Users } from '../../Models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagement implements OnInit {
  allUsers: Users[] = [];
  candidateUsers: Users[] = [];
  roles = [
    { roleId: 1, roleName: 'Admin' }, 
    { roleId: 2, roleName: 'Candidate' }, 
    { roleId: 3, roleName: 'Evaluator' }
  ];
  userForm!: FormGroup;
  isEditMode = false;
  selectedUser: Users | null = null;
  isLoading = false;

  constructor(
    private userService: User, 
    private fb: FormBuilder, 
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.initForm();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (data: Users[]) => {
        this.allUsers = data;
        this.candidateUsers = this.allUsers.filter(user => user.roleName === 'Candidate');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching users', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  initForm(): void {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roleId: [null, Validators.required]
    });
  }

  // Fixed profile picture method
  getUserProfilePicture(user: Users): string {
    if (user.profilePicturePath) {
      // Handle different path formats
      if (user.profilePicturePath.startsWith('http')) {
        return user.profilePicturePath; // Full URL
      } else if (user.profilePicturePath.startsWith('/')) {
        return user.profilePicturePath; // Absolute path
      } else {
        return `/images/${user.profilePicturePath}`; // Relative path
      }
    }
    return '/images/default-profile.png'; // Default fallback
  }

  getInitials(user: Users): string {
    if (user.fullName && user.fullName.trim()) {
      const names = user.fullName.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  }

  getRoleBadgeClass(roleName: string): string {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'role-admin';
      case 'evaluator':
        return 'role-evaluator';
      case 'candidate':
        return 'role-candidate';
      default:
        return 'role-default';
    }
  }

  onEditRole(user: Users): void {
    this.isEditMode = true;
    this.selectedUser = user;
    const userRole = this.roles.find(r => r.roleName === user.roleName);
    
    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      roleId: userRole?.roleId || null
    });
    
    // Disable name and email editing
    this.userForm.get('fullName')?.disable();
    this.userForm.get('email')?.disable();
  }

  onUpdateRole(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const newRoleId = this.userForm.get('roleId')?.value;
    if (!this.selectedUser || !newRoleId) return;

    const newRole = this.roles.find(r => r.roleId === newRoleId);
    const confirmMessage = `Are you sure you want to change ${this.selectedUser.fullName}'s role to ${newRole?.roleName}?`;
    
    if (confirm(confirmMessage)) {
      this.userService.updateUserRole(this.selectedUser.userId, newRoleId).subscribe({
        next: () => {
          this.showSuccessMessage('User role updated successfully!');
          this.resetEditMode();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error updating user role', error);
          this.showErrorMessage('Failed to update user role. Please try again.');
        }
      });
    }
  }

  onDelete(userId: number): void {
    const user = this.candidateUsers.find(u => u.userId === userId);
    if (!user) return;

    const confirmMessage = `Are you sure you want to delete ${user.fullName}? This action cannot be undone and will remove all associated assessment data.`;
    
    if (confirm(confirmMessage)) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.showSuccessMessage('User deleted successfully!');
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user', error);
          this.showErrorMessage('Failed to delete user. Please try again.');
        }
      });
    }
  }

  onViewCandidateAssessments(userId: number): void {
    this.router.navigate(['/users', userId, 'assessments']);
  }

  resetEditMode(): void {
    this.isEditMode = false;
    this.selectedUser = null;
    this.userForm.reset();
    this.userForm.get('fullName')?.enable();
    this.userForm.get('email')?.enable();
  }

  private showSuccessMessage(message: string): void {
    // You can replace this with a proper toast notification
    alert(message);
  }

  private showErrorMessage(message: string): void {
    // You can replace this with a proper toast notification
    alert(message);
  }

  // Helper method for getting formatted join date
  getFormattedJoinDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Handle profile image load errors
  onImageError(event: any): void {
    event.target.src = '/images/default-profile.png';
  }
}