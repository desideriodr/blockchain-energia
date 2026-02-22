import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { UserContextService } from '../../user-context/user-context.service';
import { Observable } from 'rxjs';
import { MeSummary } from '../../graphql/models/me-summary.model';

@Component({
  standalone: true,
  selector: 'app-topbar',
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {

  me$!: Observable<MeSummary | null>;

  constructor(
    private userContext: UserContextService,
    private auth: AuthService,
  ) {}


  ngOnInit(): void {
    this.userContext.loadMeSummary().subscribe();
    this.me$ = this.userContext.getMeSummary();
  }

  logout() {
    this.auth.logout();
    location.href = '/login';
  }
}
