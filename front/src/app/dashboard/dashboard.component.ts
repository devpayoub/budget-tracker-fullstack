import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  budgets: any[] = [];
  expenses: any[] = [];
  chart: Chart | null = null;

  username: string = '';
  loading: boolean = true;
  errorMessage: string | null = null;

  totalBudget: number = 0;
  totalSpend: number = 0;
  numOfBudgets: number = 0;

  latestBudgets: any[] = [];
  latestExpenses: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getUsernameAndDashboardData();
    this.getDashboardData();
    this.fetchData();

  }

  async getUsernameAndDashboardData() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      this.username = 'Guest';
      return;
    }
  
    const headers = { Authorization: `Bearer ${token}` };
  
    try {
      // Fetch latest username from the backend
      const response: any = await this.http.get('http://localhost:5000/api/auth/profile', { headers }).toPromise();
      this.username = response.username; // Update the username
      localStorage.setItem('username', response.username); // Save username in localStorage
  
      await this.getDashboardData(); // Fetch data after updating username
    } catch (error) {
      console.error('Error fetching username or dashboard data:', error);
      this.errorMessage = 'Failed to load dashboard data.';
    } finally {
      this.loading = false;
    }
  }
  
  async getDashboardData() {
    const token = localStorage.getItem('jwt_token');
    const budgetsUrl = 'http://localhost:5000/api/auth/budgets';
    const expensesUrl = 'http://localhost:5000/api/auth/expenses';
  
    if (!token) {
      console.error('Authentication token is missing.');
      return;
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    try {
      const budgetsResponse: any = await this.http.get(budgetsUrl, { headers }).toPromise();
      const expensesResponse: any = await this.http.get(expensesUrl, { headers }).toPromise();
  
      if (!budgetsResponse || !Array.isArray(budgetsResponse.budgets)) {
        console.error('Invalid budgets response format:', budgetsResponse);
        return;
      }
  
      if (!Array.isArray(expensesResponse)) {
        console.error('Invalid expenses response format:', expensesResponse);
        return;
      }
  
      // Process budgets and expenses
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
  
      // Dashboard summary values
      this.numOfBudgets = this.budgets.length;
      this.totalBudget = this.budgets.reduce((sum: number, budget: any) => sum + (budget.amount || 0), 0);
      this.totalSpend = expensesResponse.reduce((sum: number, expense: any) => sum + expense.amount, 0);
  
      // Latest data for the dashboard
      this.latestBudgets = this.budgets.slice(0, 5);
      this.latestExpenses = expensesResponse.slice(0, 5);
  
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  fetchData(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.error('JWT token is missing.');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch budgets and expenses
    Promise.all([
      this.http.get('http://localhost:5000/api/auth/budgets', { headers }).toPromise(),
      this.http.get('http://localhost:5000/api/auth/expenses', { headers }).toPromise(),
    ])
      .then(([budgetsResponse, expensesResponse]: any) => {
        if (budgetsResponse && budgetsResponse.budgets) {
          this.budgets = budgetsResponse.budgets;
        } else {
          console.error('Invalid budgets response:', budgetsResponse);
        }

        if (Array.isArray(expensesResponse)) {
          this.expenses = expensesResponse;
        } else {
          console.error('Invalid expenses response:', expensesResponse);
        }

        this.budgets.forEach((budget) => {
          const budgetExpenses = this.expenses.filter((exp) => exp.budgetId === budget._id);
          budget.totalSpent = budgetExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        });

        this.renderChart();
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }

  renderChart(): void {
    const ctx = document.getElementById('budgetActivityChart') as HTMLCanvasElement;

    if (ctx) {
      const labels = this.budgets.map((budget: any) => budget.name); // Extract budget names
      const totalSpend = this.budgets.map((budget: any) => budget.totalSpent || 0); // Extract total spent
      const amounts = this.budgets.map((budget: any) => budget.amount); // Extract budget amounts

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels, // Dynamic labels from API
          datasets: [
            {
              label: 'Total Spend',
              data: totalSpend, // Dynamic spend data
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
            },
            {
              label: 'Budget',
              data: amounts, // Dynamic budget data
              backgroundColor: 'rgba(153, 102, 255, 0.7)',
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Budgets',
              },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Amount ($)',
              },
            },
          },
        },
      });
    } else {
      console.error('Canvas element not found.');
    }
  }
}
