import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../authService/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading: boolean = false;
  alertMessage: string = '';
  alertClass: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.loginForm.invalid) {
      this.showAlert('Please fill out all fields correctly.', 'bg-red-100 text-red-700');
      return;
    }

    const loginData = this.loginForm.value;
    this.loading = true;

    this.authService.login(loginData).subscribe(
      (response) => {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.loading = false;
        this.showAlert('Login successful!', 'bg-green-100 text-green-700');
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        this.loading = false;
        this.showAlert('Invalid email or password. Please try again.', 'bg-red-100 text-red-700');
      }
    );
  }

  private showAlert(message: string, alertClass: string) {
    this.alertMessage = message;
    this.alertClass = alertClass;
    setTimeout(() => {
      this.alertMessage = '';
      this.alertClass = '';
    }, 4000);
  }
}
