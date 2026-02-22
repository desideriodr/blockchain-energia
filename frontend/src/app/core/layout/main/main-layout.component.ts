import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { UserContextService } from '../../user-context/user-context.service';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule, TopbarComponent, SidebarComponent, FooterComponent, RouterOutlet],
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent {

    collapsed = false;

    toggleSidebar(): void {
        this.collapsed = !this.collapsed;
    }

    constructor(
        private auth: AuthService, 
        private router: Router,
        private userContext: UserContextService) {}

    ngOnInit(): void {
        this.userContext.loadMeSummary().subscribe();
    }


    logout(): void {
        this.auth.logout();
        this.router.navigateByUrl('/');
    }
}
