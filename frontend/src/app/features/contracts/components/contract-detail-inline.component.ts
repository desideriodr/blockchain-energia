import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';

import { ContractsService } from '../../../core/graphql/services/contracts.service';
import { EnergyContract } from '../../../core/graphql/models/energy-contract.model';

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

  constructor(private contractsService: ContractsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contractId'] && this.contractId) {
      this.contract$ = this.contractsService
        .getContractById(this.contractId)
        .pipe(
          map(contract => ({
            ...contract,
            consumptions: [...(contract.consumptions ?? [])]
              .sort(
                (a, b) =>
                  new Date(b.recordedAt).getTime() -
                  new Date(a.recordedAt).getTime()
              ),
          }))
        );
    }
  }
}
