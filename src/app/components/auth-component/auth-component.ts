import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { SessionTimeoutService } from '../../services/session-timeout.service';
import { CommonModule } from '@angular/common';
import { UserLogin, UserRegister } from '../../Models/user.model';


@Component({
  selector: 'app-auth-component',
  templateUrl: './auth-component.html',
  styleUrls: ['./auth-component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink]
})
export class AuthComponent implements OnInit, OnDestroy {
  isLoginMode = true;
  authForm!: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private sessionTimeout: SessionTimeoutService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkRouteMode();
    this.initForm();
  }

  ngOnDestroy(): void {
    this.clearMessages();
  }

  private checkRouteMode(): void {
    this.isLoginMode = !this.router.url.includes('register');
  }

  private initForm(): void {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (!this.isLoginMode) {
      this.authForm.addControl('fullName', this.fb.control('', [Validators.required, Validators.minLength(2)]));
    }
  }

  onSwitchMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessages();
    this.initForm();
    const newUrl = this.isLoginMode ? '/login' : '/register';
    window.history.replaceState({}, '', newUrl);
  }

  onSubmit(): void {
    this.clearMessages();
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isLoading = true;
    const { email, password, fullName } = this.authForm.value;

    if (this.isLoginMode) {
      const credentials: UserLogin = { email, password };
      this.authService.login(credentials).subscribe({
        next: (res) => {
          this.authService.storeToken(res.token);
          this.sessionTimeout.startSession();
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
        }
      });
    } else {
      const userToRegister: UserRegister = { email, password, fullName, roleId: 2 };
      this.authService.register(userToRegister).subscribe({
        next: (res) => {
          this.authService.storeToken(res.token);
          this.sessionTimeout.startSession();
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        }
      });
    }
  }

  private clearMessages(): void {
    this.errorMessage = null;
  }
}
