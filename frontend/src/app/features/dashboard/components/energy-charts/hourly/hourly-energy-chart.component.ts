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

import {
  HourlyEnergy
} from '../../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
  standalone: true,
  selector: 'app-hourly-energy-chart',
  templateUrl: './hourly-energy-chart.component.html',
  imports: [CommonModule, NgApexchartsModule],
})
export class HourlyEnergyChartComponent implements OnChanges {

  @Input() hourlyEnergy!: HourlyEnergy[];

  // 🔹 HOURLY
  hourlySeries: ApexAxisChartSeries = [];
  hourlyChart: ApexChart = {
    type: 'area',
    height: 350,
    toolbar: { show: false }
  };
  hourlyXAxis: ApexXAxis = { categories: [] };
  hourlyTitle: ApexTitleSubtitle = {
    text: 'Producción vs Consumo (Hoy - por hora)'
  };

  dataLabels: ApexDataLabels = { enabled: false };
  stroke: ApexStroke = { curve: 'smooth' };
  legend: ApexLegend = { position: 'top' };


  ngOnChanges(): void {
    this.buildHourly();
  }

  private buildHourly() {
    if (!this.hourlyEnergy?.length) return;

    this.hourlySeries = [
      {
        name: 'Producción',
        data: this.hourlyEnergy.map(h => h.productionKwh),
      },
      {
        name: 'Consumo',
        data: this.hourlyEnergy.map(h => -h.consumptionKwh),
      },
    ];

    this.hourlyXAxis = {
      categories: this.hourlyEnergy.map(h => h.hour),
    };
  }

}