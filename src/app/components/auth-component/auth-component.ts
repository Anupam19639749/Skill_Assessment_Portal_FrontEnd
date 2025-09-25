import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-component',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './auth-component.html',
  standalone: true, 
  styleUrl: './auth-component.css'
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  authForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (!this.isLoginMode) {
      this.authForm.addControl('fullName', this.fb.control('', Validators.required));
    }
  }

  onSwitchMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.initForm();
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      return;
    }

    const { email, password, fullName } = this.authForm.value;

    if (this.isLoginMode) {
      this.authService.login({ email, password }).subscribe(
        res => {
          this.authService.storeToken(res.token);
          this.router.navigate(['/home']);
        },
        error => {
          console.error('Login failed', error);
          alert('Login failed. Please check your credentials.');
        }
      );
    } else {
      const userToRegister = {
        email,
        password,
        fullName,
        roleId: 2 // Default to Candidate (assuming RoleId 2 is Candidate)
      };
      
      this.authService.register(userToRegister).subscribe(
        res => {
          this.authService.storeToken(res.token);
          this.router.navigate(['/home']);
        },
        error => {
          console.error('Registration failed', error);
          alert('Registration failed. Please try again.');
        }
      );
    }
  }
}
