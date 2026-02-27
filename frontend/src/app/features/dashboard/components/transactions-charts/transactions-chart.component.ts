import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexStroke,
  ApexPlotOptions,
  ApexLegend,
  ApexTooltip,
  ApexGrid,
} from 'ng-apexcharts';

import { HourlyFinancial } from '../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
  standalone: true,
  selector: 'app-transactions-chart',
  templateUrl: './transactions-chart.component.html',
  styleUrls: ['./transactions-chart.component.scss'],
  imports: [CommonModule, NgApexchartsModule],
})
export class TransactionsChartComponent implements OnChanges {

  @Input() hourlyFinancial!: HourlyFinancial[];

  chartSeries: ApexAxisChartSeries = [];

  chart: ApexChart = {
    type: 'bar',
    height: 320,
    stacked: true,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    foreColor: '#6b7280',
  };

  xaxis: ApexXAxis = {
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { fontSize: '0.7rem', colors: '#9ca3af' }
    }
  };

  yaxis: ApexYAxis = {
    labels: {
      style: { fontSize: '0.7rem', colors: '#9ca3af' },
      formatter: (val: number) =>
        val.toLocaleString('es-CO', { maximumFractionDigits: 0 })
    }
  };

  dataLabels: ApexDataLabels = { enabled: false };

  stroke: ApexStroke = {
    show: true,
    width: 1,
    colors: ['transparent'],
  };

  colors = ['#0f766e', '#f87171'];   // teal ingresos, rojo suave gastos

  plotOptions: ApexPlotOptions = {
    bar: {
      horizontal: false,
      borderRadius: 3,
      columnWidth: '60%',
    }
  };

  grid: ApexGrid = {
    borderColor: '#f0f0f0',
    strokeDashArray: 4,
  };

  tooltip: ApexTooltip = {
    theme: 'light',
    style: { fontSize: '0.8rem' },
    y: {
      formatter: (val: number) =>
        `COP ${Math.abs(val).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
    }
  };

  legend: ApexLegend = {
    position: 'top',
    fontSize: '0.78rem',
    labels: { colors: '#6b7280' },
    markers: { strokeWidth: 0 },
  };

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
      ...this.xaxis,
      categories: this.hourlyFinancial.map(h => h.hour),
    };
  }
}