import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';

@Component({
  selector: 'app-budget-details',
  templateUrl: './budget-details.component.html',
  styleUrls: ['./budget-details.component.css'],
})
export class BudgetDetailsComponent implements OnInit {
  budget: any = null;
  expenses: any[] = [];
  newExpense = { name: '', amount: 0 }; 
  totalSpent: number = 0; 
  isSubmitting: boolean = false; 
  showEdit: boolean = false; 
  alertMessage: string | null = null; 
  showDeleteModal: boolean = false; 
  deletingExpenseId: string | null = null; 

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private location: Location
  ) {}

  ngOnInit(): void {
    const budgetId = this.route.snapshot.paramMap.get('id');
    if (budgetId) {
      this.loadBudgetDetails(budgetId);
    }
  }

  // Utility: Show Alert
  showAlert(message: string): void {
    console.log('Alert Triggered:', message);
    this.alertMessage = message;
    setTimeout(() => {
      this.alertMessage = null;
    }, 5000);
  }
  
  // Load Budget Details
  loadBudgetDetails(budgetId: string): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.error('JWT token is missing.');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    this.http
      .get(`http://localhost:5000/api/auth/budgets/${budgetId}`, { headers })
      .subscribe(
        (response: any) => {
          this.budget = response.budget;
          this.expenses = response.expenses || [];
          this.calculateTotalSpent();
        },
        (error) => {
          console.error('Error loading budget details:', error);
          this.showAlert('Failed to load budget details.');
        }
      );
  }
  calculateProgressBarWidth(): string {
    if (this.budget && this.budget.amount > 0) {
      const percentage = Math.min((this.totalSpent / this.budget.amount) * 100, 100);
      return `${percentage}%`;
    }
    return '0%'; // Default to 0% if budget is undefined or amount is invalid
  }
  

  calculateTotalSpent(): void {
    this.totalSpent = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  addExpense(): void {
    if (!this.newExpense.name || !this.newExpense.amount) {
        this.showAlert('Empty fields. Please fill out all fields.');
        return;
    }

    // Check if adding this expense will exceed the budget
    const potentialTotal = this.totalSpent + this.newExpense.amount;
    if (potentialTotal > this.budget.amount) {
        this.showAlert(`Expense exceeds the budget! Budget is $${this.budget.amount}, Remaining is $${this.budget.amount - this.totalSpent}`);
        return;
    }

    this.isSubmitting = true;

    const payload = {
        ...this.newExpense,
        budgetId: this.budget._id,
        userId: this.budget.userId // Ensure `userId` exists in `this.budget`
    };

    const token = localStorage.getItem('jwt_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http
        .post(`http://localhost:5000/api/auth/expenses`, payload, { headers })
        .subscribe(
            (response: any) => {
                this.expenses.push(response);
                this.calculateTotalSpent();
                this.newExpense = { name: '', amount: 0 };
                this.showAlert('Expense added successfully!');
                this.isSubmitting = false;
            },
            (error) => {
                console.error('Error adding expense:', error);
                this.showAlert('Failed to add expense.');
                this.isSubmitting = false;
            }
        );
}

  confirmDeleteBudget(): void {
    console.log('Delete button clicked'); 
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.error('JWT token is missing.');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const budgetId = this.budget._id;

    this.http.delete(`http://localhost:5000/api/auth/budgets/${budgetId}`, { headers }).subscribe(
      () => {
        this.showAlert('Budget deleted successfully!');
        this.goBack();
        this.showDeleteModal = false;
      },
      (error) => {
        console.error('Error deleting budget:', error);
        this.showAlert('Failed to delete budget.');
        this.showDeleteModal = false;
      }
    );
  }

  confirmDeleteExpense(expenseId: string): void {
    this.deletingExpenseId = expenseId;
    this.showAlert('Expense deleted successfully!');
  }

  deleteExpense(expenseId: string): void {
    console.log('Attempting to delete expense:', expenseId);
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      this.showAlert('Authentication error. Please log in again.');
      return;
    }
  
    const headers = { Authorization: `Bearer ${token}` };
    this.http.delete(`http://localhost:5000/api/auth/expenses/${expenseId}`, { headers }).subscribe(
      () => {
        console.log('Expense deleted from server:', expenseId);
        this.expenses = this.expenses.filter(expense => expense._id !== expenseId); // Remove locally
        console.log('Updated expense list:', this.expenses);        this.calculateTotalSpent();
        this.calculateProgressBarWidth;
        this.showAlert('Expense deleted successfully.');
      },
      (error) => {
        console.error('Error deleting expense:', error);
        this.showAlert('Failed to delete expense. Please try again.');
      }
    );
  }

  editBudget(): void {
    if (!this.budget.name || !this.budget.amount) {
      this.showAlert('Please fill out all fields.');
      return;
    }

    const token = localStorage.getItem('jwt_token');
    const headers = { Authorization: `Bearer ${token}` };
    const updatedData = { name: this.budget.name, amount: this.budget.amount };

    this.http
      .put(`http://localhost:5000/api/auth/budgets/${this.budget._id}`, updatedData, { headers })
      .subscribe(
        (response: any) => {
          this.budget = response;
          this.showAlert('Budget updated successfully!');
          this.hideEditModal();
        },
        (error) => {
          console.error('Error updating budget:', error);
          this.showAlert('Failed to update budget.');
        }
      );
  }

  goBack(): void {
    this.location.back();
  }

  showEditModal(): void {
    this.showEdit = true;
  }

  hideEditModal(): void {
    this.showEdit = false;
  }
}
