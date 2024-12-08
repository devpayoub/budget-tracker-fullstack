import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { Title } from '@angular/platform-browser';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { BudgetsComponent } from './budgets/budgets.component';
import { BudgetDetailsComponent } from './budget-details/budget-details.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { AuthGuard } from './authService/auth.guard';
import { UpgradeComponent } from './upgrade/upgrade.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent,  data: { title: 'Login' } },
  { path: 'register', component: RegisterComponent,  data: { title: 'Register' } },
  { path: 'dashboard', component: DashboardComponent,  data: { title: 'Dashboard' } },
  { path: 'sidebar', component: SidebarComponent},
  { path: 'budgets', component: BudgetsComponent},
  { path: 'budgets/:id', component: BudgetDetailsComponent },
  { path: 'expenses', component: ExpensesComponent},
  { path: 'upgrade', component: UpgradeComponent},
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
