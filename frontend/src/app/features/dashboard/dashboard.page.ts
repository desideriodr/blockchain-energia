import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Observable } from 'rxjs';

import { DashboardEnergyFinancialService } from '../../core/graphql/services/dashboard-energy-financial.service';

import { DashboardEnergyFinancial } from '../../core/graphql/models/dashboard-energy-financial.model';

import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { HourlyEnergyChartComponent } from './components/energy-charts/hourly/hourly-energy-chart.component';
import { MonthlyEnergyChartComponent } from './components/energy-charts/monthly/monthly-energy-chart.component';
import { SourceDistributionChartComponent } from './components/source-charts/source-distribution-chart.component';
import { TransactionsChartComponent } from './components/transactions-charts/transactions-chart.component';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    CommonModule,
    NgApexchartsModule,
    KpiCardsComponent,
    HourlyEnergyChartComponent,
    MonthlyEnergyChartComponent,
    SourceDistributionChartComponent,
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

  energyMonthlyBalanceValue = 0;
  walletMonthlyBalanceValue = 0;
  
  ngOnInit() {
    this.dashboardEnergyFinancial$.subscribe(data => {

      // Balance energético
      const totalProduction = data.monthlyEnergy
        .reduce((sum, d) => sum + d.productionKwh, 0);

      const totalConsumption = data.monthlyEnergy
        .reduce((sum, d) => sum + d.consumptionKwh, 0);

      this.energyMonthlyBalanceValue =
        totalProduction - totalConsumption;

      // Balance billetera
      this.walletMonthlyBalanceValue =
        data.hourlyFinancial
          .reduce((sum, h) =>
            sum + h.incomeCOP - h.expenseCOP, 0);

    });
  }
}