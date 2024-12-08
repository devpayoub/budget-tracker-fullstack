import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.component.html',
  styleUrls: ['./budgets.component.css'],
})
export class BudgetsComponent implements OnInit {
  budgets: any[] = [];
  showModal = false;
  newBudget = { name: '', amount: 0 };
  alertMessage: string | null = null;
  username: string = 'User';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      this.username = storedUsername;
    }

    this.loadBudgets();
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.newBudget = { name: '', amount: 0 };
  }

  closeAlert(): void {
    this.alertMessage = null;
  }

  displayAlert(message: string): void {
    this.alertMessage = message;
    setTimeout(() => {
      this.alertMessage = null;
    }, 5000); 
  }

  loadBudgets(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.error('JWT token is missing.');
      return;
    }
  
    const headers = { Authorization: `Bearer ${token}` };
  
    this.http.get('http://localhost:5000/api/auth/budgets', { headers }).subscribe(
      (budgetsResponse: any) => {
        if (!budgetsResponse || !Array.isArray(budgetsResponse.budgets)) {
          console.error('Invalid budgets response format:', budgetsResponse);
          return;
        }
  
        this.http.get('http://localhost:5000/api/auth/expenses', { headers }).subscribe(
          (expensesResponse: any) => {
            if (!Array.isArray(expensesResponse)) {
              console.error('Invalid expenses response format:', expensesResponse);
              return;
            }
  
            this.budgets = budgetsResponse.budgets.map((budget: any) => {
              const expenses = expensesResponse.filter((exp: any) => exp.budgetId === budget._id);
              const totalSpent = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
              return {
                ...budget,
                itemsCount: expenses.length,
                totalSpent,
                remainingAmount: budget.amount - totalSpent,
              };
            });
  
            console.log('Processed Budgets with Expenses:', this.budgets);
          },
          (error) => console.error('Error fetching expenses:', error)
        );
      },
      (error) => console.error('Error fetching budgets:', error)
    );
  }
    
  addBudget(): void {
    if (!this.newBudget.name || this.newBudget.amount <= 0) {
      this.displayAlert('Empty fields are not allowed!');
      return;
    }

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.error('JWT token is missing.');
      return;
    }

    const payload = {
      name: this.newBudget.name,
      amount: this.newBudget.amount,
    };

    const apiUrl = 'http://localhost:5000/api/auth/budgets';
    const headers = { Authorization: `Bearer ${token}` };

    this.http.post(apiUrl, payload, { headers }).subscribe(
      (response: any) => {
        this.budgets.push(response);
        this.closeModal();
        this.displayAlert('Budget added successfully!');
      },
      (error) => {
        console.error('Error adding budget:', error);
      }
    );
  }
}
