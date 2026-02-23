import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ContractsService } from '../../../core/graphql/services/contracts.service';
import { EnergyContract, User } from '../../../core/graphql/models/energy-contract.model';
import { ContractDetailInlineComponent } from '../components/contract-detail-inline.component';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContractDetailInlineComponent,
  ],
  templateUrl: './contracts.page.html',
  styleUrls: ['./contracts.page.scss'],
})
export class ContractsPage implements OnInit {

  contracts$!: Observable<EnergyContract[]>;
  loading = false;
  selectedContractId: string | null = null;

  page = 1;
  pageSize = 10;

  constructor(
    private contractsService: ContractsService,
  ) { }

  ngOnInit(): void {
    this.contracts$ = this.contractsService.getContracts();
  }

  /** abre / cierra el detalle inline */
  toggle(contractId: string): void {
    this.selectedContractId =
      this.selectedContractId === contractId ? null : contractId;
  }

  getFullName(user?: User): string {
    if (!user) return '-';
    return `${user.nombres} ${user.apellidos}`;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    this.page++;
  }

  cancel(contractId: string): void {

    const confirmed = confirm('¿Estás seguro de cancelar este contrato?');
    if (!confirmed) return;

    this.loading = true;

    this.contractsService.cancelContract(contractId)
      .subscribe({
        next: () => {
          this.loading = false;

          // refetch limpio
          this.contracts$ = this.contractsService.getContracts();
        },
        error: (err) => {
          this.loading = false;
          alert(err.message || 'Error al cancelar contrato');
        }
      });
  }
}
