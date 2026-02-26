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
  HourlyEnergy,
  DailyEnergy,
  EnergySourceDistribution
} from '../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
  standalone: true,
  selector: 'app-energy-chart',
  templateUrl: './energy-chart.component.html',
  imports: [CommonModule, NgApexchartsModule],
})
export class EnergyChartComponent implements OnChanges {

  @Input() hourlyEnergy!: HourlyEnergy[];
  @Input() monthlyEnergy!: DailyEnergy[];
  @Input() sourceDistribution!: EnergySourceDistribution[];


  // 🔹 HOURLY
  hourlySeries: ApexAxisChartSeries = [];
  hourlyChart: ApexChart = {
    type: 'area',
    height: 280,
    width: '100%',
    toolbar: { show: false }
  };
  hourlyXAxis: ApexXAxis = { categories: [] };
  hourlyTitle: ApexTitleSubtitle = {
    text: 'Producción vs Consumo (Hoy - por hora)'
  };

  // 🔹 MONTHLY
  monthlySeries: ApexAxisChartSeries = [];
  monthlyChart: ApexChart = {
    type: 'area',
    height: 280,
    width: '100%',
    toolbar: { show: false },
    zoom: { enabled: false }
  };
  monthlyXAxis: ApexXAxis = { categories: [] };
  monthlyBalance: number = 0;
  

  // SOURCES DISTRIBUTION
  sourceSeries: ApexNonAxisChartSeries = [];
  sourceLabels: string[] = [];
  sourceChart: ApexChart = {
    type: 'donut',
    height: 280
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
    this.buildHourly();
    this.buildMonthly();
    this.buildSourceDistribution();
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

  private buildMonthly() {
    if (!this.monthlyEnergy?.length) return;

    this.monthlySeries = [
      {
        name: 'Producción',
        data: this.monthlyEnergy.map(d => d.productionKwh),
      },
      {
        name: 'Consumo',
        data: this.monthlyEnergy.map(d => -d.consumptionKwh),
      },
    ];

    this.monthlyXAxis = {
      categories: this.monthlyEnergy.map(d => d.day.slice(8)), // solo día
    };

    const totalProduction = this.monthlyEnergy
      .reduce((sum, d) => sum + d.productionKwh, 0);

    const totalConsumption = this.monthlyEnergy
      .reduce((sum, d) => sum + d.consumptionKwh, 0);

    this.monthlyBalance = totalProduction - totalConsumption;
  }

  private buildSourceDistribution() {
    if (!this.sourceDistribution?.length) return;
    
    this.sourceSeries = this.sourceDistribution.map(s => s.productionKwh);
    this.sourceLabels = this.sourceDistribution.map(s => s.sourceType);
  }
}