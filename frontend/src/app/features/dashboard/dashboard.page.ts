import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Observable } from 'rxjs';

import { DashboardEnergyFinancialService } from '../../core/graphql/services/dashboard-energy-financial.service';

import { DashboardEnergyFinancial } from '../../core/graphql/models/dashboard-energy-financial.model';

import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { EnergyChartComponent } from './components/energy-chart/energy-chart.component';
import { TransactionsChartComponent } from './components/transactions-chart/transactions-chart.component';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    CommonModule,
    NgApexchartsModule,
    KpiCardsComponent,
    EnergyChartComponent,
    TransactionsChartComponent
  ],
})
export class DashboardPage {

  dashboardEnergyFinancial$: Observable<DashboardEnergyFinancial>;

  constructor(
    private dashboardEnergyFinancialService: DashboardEnergyFinancialService
  ) {
    this.dashboardEnergyFinancial$ = this.dashboardEnergyFinancialService.getDashboard();
  }
}