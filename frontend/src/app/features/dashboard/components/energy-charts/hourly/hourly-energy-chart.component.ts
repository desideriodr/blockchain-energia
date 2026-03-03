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
  ApexTitleSubtitle,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexGrid,
} from 'ng-apexcharts';

import { HourlyEnergy } from '../../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
  standalone: true,
  selector: 'app-hourly-energy-chart',
  templateUrl: './hourly-energy-chart.component.html',
  styleUrls: ['./hourly-energy-chart.component.scss'],
  imports: [CommonModule, NgApexchartsModule],
})
export class HourlyEnergyChartComponent implements OnChanges {

  @Input() hourlyEnergy!: HourlyEnergy[];

  hourlySeries: ApexAxisChartSeries = [];

  hourlyChart: ApexChart = {
    type: 'area',
    height: 320,
    toolbar: { show: false },
    fontFamily: 'inherit',             // hereda la fuente de la app
    foreColor: '#6b7280',              // color base de textos/ejes
  };

  hourlyXAxis: ApexXAxis = {
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { fontSize: '0.7rem', colors: '#9ca3af' }
    }
  };

  hourlyYAxis: ApexYAxis = {
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

  // Colores: teal para producción, verde claro para consumo
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
  markers: { strokeWidth: 0 },   // ← quitar size, no existe en este tipo
};
  ngOnChanges(): void {
    this.buildHourly();
  }

  private buildHourly(): void {
    if (!this.hourlyEnergy?.length) return;

    this.hourlySeries = [
      {
        name: 'Producción',
        data: this.hourlyEnergy.map(h => h.productionKwh),
      },
      {
        name: 'Consumo',
        data: this.hourlyEnergy.map(h => h.consumptionKwh),
      },
    ];

    this.hourlyXAxis = {
      ...this.hourlyXAxis,
      categories: this.hourlyEnergy.map(h => h.hour),
    };
  }
}