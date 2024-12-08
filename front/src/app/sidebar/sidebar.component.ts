import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  constructor(private router: Router, private http: HttpClient) {}

  isOpen = true;

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    const token = localStorage.getItem('jwt_token'); // get the token
    if (!token) {
      console.error('No token found. Please log in first.');
      return;
    }
  
    this.http.post('http://localhost:5000/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }, // Include token in headers
    }).subscribe(
      (response: any) => {
        console.log('Logged out successfully:', response);
        localStorage.removeItem('jwt_token'); // Clear token from storage
        this.router.navigate(['/login']); 
      },
      (error) => {
        console.error('Logout failed:', error);
      }
    );
  }
  

  
}
