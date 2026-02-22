import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-kpi-cards',
  templateUrl: './kpi-cards.component.html',
  styleUrls: ['./kpi-cards.component.scss'],
  imports: [CommonModule],
})
export class KpiCardsComponent {

  @Input({ required: true })
  kpis!: {
    totalEnergyProduced: number;
    totalEnergyTransferred: number;
    totalTransactions: number;
  };
}
