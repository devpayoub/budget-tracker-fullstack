import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../authService/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading: boolean = false;
  successMessage: string = ''; 
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private userService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill out all required fields correctly.';
      this.clearMessagesAfterDelay();
      return;
    }

    const userData = this.registerForm.value;
    this.loading = true;

    this.userService.register(userData).subscribe(
      (response) => {
        this.loading = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        this.clearMessagesAfterDelay();

        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 4000);
      },
      (error) => {
        this.loading = false;
        if (error.status === 400 && error.error.msg === 'Email already exists') {
          this.errorMessage = 'Email already exists. Please use another email.';
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }
        this.clearMessagesAfterDelay();
      }
    );
  }

  private clearMessagesAfterDelay() {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 4000);
  }
}
