import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexTitleSubtitle
} from 'ng-apexcharts';

import { TimeSeriesPoint } from '../../../../core/graphql/models/dashboard-home.model';

@Component({
  standalone: true,
  selector: 'app-energy-chart',
  templateUrl: './energy-chart.component.html',
  imports: [CommonModule, NgApexchartsModule],
})
export class EnergyChartComponent implements OnChanges {

  @Input({ required: true })
  seriesData!: TimeSeriesPoint[];

  chartSeries: ApexAxisChartSeries = [];
  chart: ApexChart = { type: 'line', height: 300 };
  xaxis: ApexXAxis = { categories: [] };
  dataLabels: ApexDataLabels = { enabled: false };
  stroke: ApexStroke = { curve: 'smooth' };
  title: ApexTitleSubtitle = { text: 'Producción de Energía (kWh)' };

  ngOnChanges(): void {
    if (!this.seriesData?.length) return;

    this.chartSeries = [
      {
        name: 'kWh producidos',
        data: this.seriesData.map(p => p.value),
      },
    ];

    this.xaxis = {
      categories: this.seriesData.map(p => p.date),
    };
  }
}
