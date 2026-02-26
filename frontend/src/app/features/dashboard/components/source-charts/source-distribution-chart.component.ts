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
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexResponsive
} from 'ng-apexcharts';

import { EnergySourceDistribution } from '../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
  standalone: true,
  selector: 'app-source-distribution-chart',
  templateUrl: './source-distribution-chart.component.html',
  imports: [CommonModule, NgApexchartsModule],
})
export class SourceDistributionChartComponent implements OnChanges {

  @Input() sourceDistribution!: EnergySourceDistribution[];

  // SOURCES DISTRIBUTION
  sourceSeries: ApexNonAxisChartSeries = [];
  sourceLabels: string[] = [];
  sourceChart: ApexChart = {
    type: 'donut',
    height: 350
  };
  sourceTitle: ApexTitleSubtitle = { text: 'Distribución por Fuente' };
  responsive: ApexResponsive[] = [
    {
      breakpoint: 480,
      options: {
        chart: { width: 250 },
        legend: { position: 'bottom' }
      }
    }
  ];

  dataLabels: ApexDataLabels = { enabled: false };
  stroke: ApexStroke = { curve: 'smooth' };
  legend: ApexLegend = { position: 'top' };

  ngOnChanges(): void {
    this.buildSourceDistribution();
  }

  private buildSourceDistribution() {
    if (!this.sourceDistribution?.length) return;
    
    this.sourceSeries = this.sourceDistribution.map(s => s.productionKwh);
    this.sourceLabels = this.sourceDistribution.map(s => s.sourceType);
  }
}