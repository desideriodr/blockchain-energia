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
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexGrid,
} from 'ng-apexcharts';

import { DailyEnergy } from '../../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
  standalone: true,
  selector: 'app-monthly-energy-chart',
  templateUrl: './monthly-energy-chart.component.html',
  styleUrls: ['./monthly-energy-chart.component.scss'],
  imports: [CommonModule, NgApexchartsModule],
})
export class MonthlyEnergyChartComponent implements OnChanges {

  @Input() monthlyEnergy!: DailyEnergy[];

  monthlySeries: ApexAxisChartSeries = [];

  monthlyChart: ApexChart = {
    type: 'area',
    height: 320,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    foreColor: '#6b7280',
  };

  monthlyXAxis: ApexXAxis = {
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { fontSize: '0.7rem', colors: '#9ca3af' }
    }
  };

  monthlyYAxis: ApexYAxis = {
    labels: {
      style: { fontSize: '0.7rem', colors: '#9ca3af' },
      formatter: (val: number) =>
        val.toLocaleString('es-CO', { maximumFractionDigits: 0 })
    }
  };

  dataLabels: ApexDataLabels = { enabled: false };

  stroke: ApexStroke = {
    curve: 'smooth',
    width: 2,
  };

  colors = ['#0f766e', '#db2626'];

  fill: ApexFill = {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.02,
      stops: [0, 90, 100],
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
        `${val.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kWh`
    }
  };

  legend: ApexLegend = {
    position: 'top',
    fontSize: '0.78rem',
    labels: { colors: '#6b7280' },
    markers: { strokeWidth: 0 },
  };

  ngOnChanges(): void {
    this.buildMonthly();
  }

  private buildMonthly(): void {
    if (!this.monthlyEnergy?.length) return;

    this.monthlySeries = [
      {
        name: 'Producción',
        data: this.monthlyEnergy.map(d => d.productionKwh),
      },
      {
        name: 'Consumo',
        data: this.monthlyEnergy.map(d => d.consumptionKwh),
      },
    ];

    this.monthlyXAxis = {
      ...this.monthlyXAxis,
      categories: this.monthlyEnergy.map(d => d.day.slice(8)),
    };
  }
}