import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';

import { ContractsService } from '../../../core/graphql/services/contracts.service';
import { EnergyContract } from '../../../core/graphql/models/energy-contract.model';
import { EnergyConsumption } from '../../../core/graphql/models/energy-consumption.model';

@Component({
  selector: 'app-contract-detail-inline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contract-detail-inline.component.html',
  styleUrls: ['./contract-detail-inline.component.scss'],
})
export class ContractDetailInlineComponent implements OnChanges {

  @Input() contractId!: string;

  contract$?: Observable<EnergyContract>;

  // ── Paginación cliente ────────────────────────────────────
  allConsumptions: EnergyConsumption[] = [];

  page      = 1;
  pageSize  = 5;
  pagedConsumptions: EnergyConsumption[] = [];

  constructor(private contractsService: ContractsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contractId'] && this.contractId) {
      this.page = 1; // resetear al cambiar de contrato

      this.contract$ = this.contractsService
        .getContractById(this.contractId)
        .pipe(
          map(contract => {
            // Guardar todos ordenados para paginar
            this.allConsumptions = [...(contract.consumptions ?? [])]
              .sort((a, b) =>
                new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
              );

            this.updatePage();

            return { ...contract, consumptions: contract.consumptions ?? [] };
          })
        );
    }
  }

  get totalPages(): number {
    return Math.ceil(this.allConsumptions.length / this.pageSize) || 1;
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.updatePage();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.updatePage();
    }
  }

  private updatePage(): void {
    const start = (this.page - 1) * this.pageSize;
    this.pagedConsumptions = this.allConsumptions.slice(start, start + this.pageSize);
  }
}