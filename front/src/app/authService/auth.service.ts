import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  token: string | null | undefined;
  budget: any;
  expenses: any;

  constructor(private http: HttpClient) {}

  // Register
  register(userData: { username: string; email: string; password: string }): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post(`${this.apiUrl}/register`, userData, { headers }).pipe(
      catchError(this.handleError),
      tap((response: any) => {
        this.setToken(response.token, response.user.username, response.user.id);
      })
    );
  }

  // Login
  login(loginData: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, loginData).pipe(
      tap((response: any) => {
        console.log('Login response:', response);
        this.setToken(response.token, response.user.username, response.user.id); // Save userId
        console.log('Saved userId:', localStorage.getItem('userId'));
      }),
      catchError(this.handleError)
    );
  }
  
  // Save JWT token after login or registration
  setToken(token: string, username: string, userId: string): void {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', userId);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  // Budget APIs
  addBudget(budgetData: { name: string; amount: number }): Observable<any> {
    const token = this.getToken();
    if (!token) {
      console.error('No token found. Cannot add budget.');
      return throwError('Authentication token is missing.');
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/budgets`, budgetData, { headers }).pipe(
      catchError(this.handleError)
    );
  }
    
  getBudgets(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      console.error('No token found. Cannot fetch budgets.');
      return throwError('Authentication token is missing.');
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/budgets`, { headers }).pipe(
      catchError(this.handleError)
    );
  }
    
  loadBudgetDetails(budgetId: string): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.error('JWT token is missing.');
      return;
    }
  
    const headers = { Authorization: `Bearer ${token}` }; // Add Authorization header
    this.http.get(`http://localhost:5000/api/auth/budgets/${budgetId}`, { headers }).subscribe(
      (response: any) => {
        console.log('Budget Details:', response);
        this.budget = response.budget;
        this.expenses = response.expenses || [];
      },
      (error) => {
        console.error('Error loading budget details:', error);
      }
    );
  }
  

  // Logout
  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
  }

  // Error handler
  private handleError(error: any) {
    console.error('Error occurred:', error);
    let errorMessage = 'An unknown error occurred!';
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }
    return throwError(errorMessage);
  }
}
