import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexChart,
  ApexTitleSubtitle,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexDataLabels,
  ApexTooltip,
  ApexPlotOptions,
} from 'ng-apexcharts';

import { EnergySourceDistribution } from '../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
  standalone: true,
  selector: 'app-source-distribution-chart',
  templateUrl: './source-distribution-chart.component.html',
  styleUrls: ['./source-distribution-chart.component.scss'],
  imports: [CommonModule, NgApexchartsModule],
})
export class SourceDistributionChartComponent implements OnChanges {

  @Input() sourceDistribution!: EnergySourceDistribution[];

  sourceSeries: ApexNonAxisChartSeries = [];
  sourceLabels: string[] = [];

  sourceChart: ApexChart = {
    type: 'donut',
    height: 320,
    toolbar: { show: false },
    fontFamily: 'inherit',
    foreColor: '#6b7280',
  };

  // Paleta coherente con la app
  colors = ['#0f766e', '#86efac', '#f59e0b', '#f87171', '#8b5cf6'];

  plotOptions: ApexPlotOptions = {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#1f2937',
            formatter: (w) => {
              const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              return `${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })} kWh`;
            }
          },
          value: {
            fontSize: '1.1rem',
            fontWeight: '700',
            color: '#1f2937',
            formatter: (val) =>
              `${Number(val).toLocaleString('es-CO', { maximumFractionDigits: 0 })} kWh`
          }
        }
      }
    }
  };

  dataLabels: ApexDataLabels = {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(1)}%`,
    style: {
      fontSize: '0.75rem',
      fontFamily: 'inherit',
      colors: ['#fff'],
    },
    dropShadow: { enabled: false }
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
    position: 'right',
    fontSize: '0.78rem',
    labels: { colors: '#6b7280' },
    markers: { strokeWidth: 0 },
    itemMargin: { vertical: 4 },
  };

  responsive: ApexResponsive[] = [
    {
      breakpoint: 600,
      options: {
        chart: { height: 280 },
        legend: { position: 'bottom' }
      }
    }
  ];

  ngOnChanges(): void {
    this.buildSourceDistribution();
  }

  private buildSourceDistribution(): void {
    if (!this.sourceDistribution?.length) return;

    this.sourceSeries = this.sourceDistribution.map(s => s.productionKwh);
    this.sourceLabels = this.sourceDistribution.map(s => s.sourceType);
  }
}