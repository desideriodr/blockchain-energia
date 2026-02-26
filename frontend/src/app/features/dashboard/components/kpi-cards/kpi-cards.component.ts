import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractsCount } from '../../../../core/graphql/models/dashboard-energy-financial.model';

@Component({
  standalone: true,
  selector: 'app-kpi-cards',
  templateUrl: './kpi-cards.component.html',
  styleUrls: ['./kpi-cards.component.scss'],
  imports: [CommonModule],
})
export class KpiCardsComponent {

  @Input() energyMonthlyBalance: number = 0;
  @Input() walletMonthlyBalance: number = 0;
  @Input() contractsCount!: ContractsCount[];

  get buyerContracts(): number {
    return this.contractsCount?.[0]?.activeContracts ?? 0;
  }

  get sellerContracts(): number {
    return this.contractsCount?.[0]?.contractedOffers ?? 0;
  }

}