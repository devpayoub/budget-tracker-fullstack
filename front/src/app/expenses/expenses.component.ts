import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css'],
})
export class ExpensesComponent implements OnInit {
  expenses: any[] = []; //store all expenses
  errorMessage: string = '';
  showDeleteModal: boolean = false;
  expenseToDelete: string | null = null; //with id
  alertMessage: string | null = null;


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      this.errorMessage = 'Authentication error. Please log in again.';
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    this.http.get('http://localhost:5000/api/auth/expenses', { headers }).subscribe(
      (response: any) => {
        this.expenses = response;
      },
      (error) => {
        console.error('Error fetching expenses:', error);
        this.errorMessage = 'Failed to load expenses. Please try again later.';
      }
    );
  }

  openDeleteModal(expenseId: string): void {
    this.showDeleteModal = true;
    this.expenseToDelete = expenseId;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.expenseToDelete = null;
  }

  confirmDelete(): void {
    if (this.expenseToDelete) {
      this.deleteExpense(this.expenseToDelete);
    }
    this.closeDeleteModal();
  }

  deleteExpense(expenseId: string): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      this.errorMessage = 'Authentication error. Please log in again.';
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    this.http.delete(`http://localhost:5000/api/auth/expenses/${expenseId}`, { headers }).subscribe(
      () => {
        this.expenses = this.expenses.filter(expense => expense._id !== expenseId); // Remove the deleted expense from the list
        this.showAlert('Expense deleted successfully.');
      },
      (error) => {
        console.error('Error deleting expense:', error);
        this.showAlert('Failed to delete expense. Please try again.');
      }
    );
  }
  showAlert(message: string): void {
    this.alertMessage = message;
    setTimeout(() => {
      this.alertMessage = null;
    }, 5000); 
  }
  

}
