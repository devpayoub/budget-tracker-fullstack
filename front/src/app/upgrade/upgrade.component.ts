import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css']
})
export class UpgradeComponent implements OnInit {
  profileForm: FormGroup;
  alertMessage: string | null = null;
  currentProfile: any;
  alertClass: string | undefined;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      userId: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
  
    const headers = { Authorization: `Bearer ${token}` };
  
    this.http.get('http://localhost:5000/api/auth/profile', { headers }).subscribe(
      (response: any) => {
        this.profileForm.patchValue({
          userId: response.userId,
          username: response.username, // Pre-fill user
          email: response.email, // Pre-fill email
        });
        this.currentProfile = response; // Store the info
      },
      (error) => {
        console.error('Error fetching profile:', error);
        this.alertMessage = 'Failed to load profile data.';
      }
    );
  }
  
  updateProfile(): void {
    const updates: any = {};
    const currentData = this.profileForm.value;
  
    if (currentData.userId && currentData.userId !== this.currentProfile.userId) {
      updates.userId = currentData.userId;
    }
    if (currentData.username && currentData.username !== this.currentProfile.username) {
      updates.username = currentData.username;
    }
  
    if (currentData.email && currentData.email !== this.currentProfile.email) {
      updates.email = currentData.email;
    }
  
    if (currentData.password) {
      updates.password = currentData.password;
    }
  
    if (Object.keys(updates).length === 0) {
      this.alertMessage = 'No changes detected.';
      return;
    }
  
    const headers = { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` };
    this.http.put('http://localhost:5000/api/auth/update-profile', updates, { headers }).subscribe(
      (response: any) => {
        console.log('Profile updated:', response);
        this.alertMessage = 'Profile updated successfully!';
        this.alertClass = 'bg-green-100 text-green-700';
// Update username in localStorage if it was changed
        if (updates.username) {
          localStorage.setItem('username', updates.username);
        }
  
      },
      (error) => {
        console.error('Error updating profile:', error);
        this.alertMessage = 'Failed to update profile.';
        this.alertClass = 'bg-red-100 text-red-700';
      }
    );
  }
    }
  
