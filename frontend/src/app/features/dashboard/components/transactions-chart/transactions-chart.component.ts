import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexTitleSubtitle,
  ApexPlotOptions,
  ApexLegend
} from 'ng-apexcharts';

import { HourlyFinancial } from '../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
  standalone: true,
  selector: 'app-transactions-chart',
  templateUrl: './transactions-chart.component.html',
  imports: [CommonModule, NgApexchartsModule],
})
export class TransactionsChartComponent implements OnChanges {

  @Input() hourlyFinancial!: HourlyFinancial[];

  chartSeries: ApexAxisChartSeries = [];
  chart: ApexChart = { type: 'bar', height: 350, stacked: true };
  xaxis: ApexXAxis = { categories: [] };
  dataLabels: ApexDataLabels = { enabled: false };
  stroke: ApexStroke = { width: 1 };
  title: ApexTitleSubtitle = { text: 'Ingresos vs Gastos (COP - Hoy)' };
  plotOptions: ApexPlotOptions = {
    bar: { horizontal: false }
  };
  legend: ApexLegend = { position: 'top' };

  ngOnChanges(): void {
    if (!this.hourlyFinancial?.length) return;

    this.chartSeries = [
      {
        name: 'Ingresos',
        data: this.hourlyFinancial.map(h => h.incomeCOP),
      },
      {
        name: 'Gastos',
        data: this.hourlyFinancial.map(h => -h.expenseCOP),
      },
    ];

    this.xaxis = {
      categories: this.hourlyFinancial.map(h => h.hour),
    };
  }
}