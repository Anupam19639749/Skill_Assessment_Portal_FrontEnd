import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { User } from '../../services/user';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Users } from '../../Models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})

export class UserManagement implements OnInit {
  users: Users[] = []; // STRONGLY-TYPED
  roles = [{ roleId: 1, roleName: 'Admin' }, { roleId: 2, roleName: 'Candidate' }, { roleId: 3, roleName: 'Evaluator' }];
  userForm!: FormGroup;
  isEditMode = false;
  selectedUser: Users | null = null; // STRONGLY-TYPED

  constructor(private userService: User, private fb: FormBuilder, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadUsers();
    this.initForm();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe(
      (data: Users[]) => { // STRONGLY-TYPED DATA
        this.users = data;
        this.cdr.detectChanges(); 
      },
      (error) => {
        console.error('Error fetching users', error);
      }
    );
  }

  initForm(): void {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roleId: [null, Validators.required]
    });
  }

  onEdit(user: Users): void { // STRONGLY-TYPED INPUT
    this.isEditMode = true;
    this.selectedUser = user;
    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      roleId: this.roles.find(r => r.roleName === user.roleName)?.roleId
    });
    this.userForm.get('fullName')?.disable();
    this.userForm.get('email')?.disable();
  }

  onUpdateRole(): void {
    if (this.userForm.invalid) {
      return;
    }
    if(confirm('Are you sure you want to Update this user?'))
    {
      // The logic here is correct and relies on strongly-typed properties from selectedUser
      const newRoleId = this.userForm.get('roleId')?.value;
      if (this.selectedUser && newRoleId !== null) {
        this.userService.updateUserRole(this.selectedUser.userId, newRoleId).subscribe(
          () => {
            alert('User role updated successfully!');
            this.isEditMode = false;
            this.selectedUser = null;
            this.userForm.reset();
            this.loadUsers();
          },
          (error) => console.error('Error updating user role', error)
        );
      }
    }
  }

  onDelete(userId: number): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.userService.deleteUser(userId).subscribe(
        () => {
          alert('User deleted successfully!');
          this.loadUsers();
        },
        (error) => console.error('Error deleting user', error)
      );
    }
  }
}