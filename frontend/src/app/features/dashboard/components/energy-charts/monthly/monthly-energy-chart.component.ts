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

import { DailyEnergy } from '../../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
    standalone: true,
    selector: 'app-monthly-energy-chart',
    templateUrl: './monthly-energy-chart.component.html',
    imports: [CommonModule, NgApexchartsModule],
})
export class MonthlyEnergyChartComponent implements OnChanges {

    @Input() monthlyEnergy!: DailyEnergy[];


    // 🔹 MONTHLY
    monthlySeries: ApexAxisChartSeries = [];
    monthlyChart: ApexChart = {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        zoom: { enabled: false }
    };
    monthlyXAxis: ApexXAxis = { categories: [] };
    monthlyTitle: ApexTitleSubtitle = {
        text: 'Producción vs Consumo (Mes actual)'
    };


    dataLabels: ApexDataLabels = { enabled: false };
    stroke: ApexStroke = { curve: 'smooth' };
    legend: ApexLegend = { position: 'top' };

    ngOnChanges(): void {
        this.buildMonthly();
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
    }

}