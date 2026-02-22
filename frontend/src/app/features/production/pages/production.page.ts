import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { ProductionService } from '../../../core/graphql/services/dashboard-production.service';
import { ProductionDashboard } from '../../../core/graphql/models/dashboard-production.model';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './production.page.html',
  styleUrls: ['./production.page.scss'],
})
export class ProductionPage implements OnInit {

  dashboard$!: Observable<ProductionDashboard>;

  constructor(
    private service: ProductionService,
  ) {}

  ngOnInit() {
    this.dashboard$ = this.service.getDashboard();
  }
}
