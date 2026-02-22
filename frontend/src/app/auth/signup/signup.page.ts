import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})

export class SignupPage {
  nombres = '';
  apellidos = '';
  email = '';
  password = '';
  errorMsg = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.loading = true;
    this.errorMsg = '';

    this.auth.signup(this.nombres, this.apellidos, this.email, this.password).subscribe({
      next: (res) => {
        const token = res.data.signup.access_token;
        this.auth.saveToken(token);
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.message || 'Error creando usuario';
      }
    });
  }
}