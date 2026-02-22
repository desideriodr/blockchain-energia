import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})

export class LoginPage {
  email = '';
  password = '';
  errorMsg = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.loading = true;
    this.errorMsg = '';

    this.auth.login(this.email, this.password).subscribe({
      next: ({data}) => {
        const token = data.login.access_token;
        this.auth.saveToken(token);
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.message || 'Credenciales inválidas';
      },
    });
  }
}