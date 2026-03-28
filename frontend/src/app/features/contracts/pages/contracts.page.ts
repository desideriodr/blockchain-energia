import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ContractsService } from '../../../core/graphql/services/contracts.service';
import { ContractStatus, EnergyContract, User, VISIBLE_CONTRACT_STATUSES } from '../../../core/graphql/models/energy-contract.model';
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

  readonly ContractStatus = ContractStatus;

  page = 1;
  pageSize = 10;

  constructor(private contractsService: ContractsService) { }

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.contracts$ = this.contractsService.getContracts().pipe(
      map(contracts => contracts.filter(c => VISIBLE_CONTRACT_STATUSES.includes(c.status)))
    );
  }

  statusLabel(status: ContractStatus): string {
    const labels: Record<ContractStatus, string> = {
      [ContractStatus.ACTIVE]:                       'Activo',
      [ContractStatus.SUSPENDED_INSUFFICIENT_FUNDS]: 'Suspendido — fondos insuficientes',
      [ContractStatus.SUSPENDED_NO_PRODUCTION]:      'Suspendido — sin producción',
      [ContractStatus.FAILED]:                       'Fallido',
      [ContractStatus.PENDING_BLOCKCHAIN]:           'Pendiente',
      [ContractStatus.CANCELED_BY_BUYER]:            'Cancelado por comprador',
      [ContractStatus.CANCELED_BY_SELLER]:           'Cancelado por vendedor',
      [ContractStatus.TERMINATED_TERMS_EXPIRED]:     'Terminado',
    };
    return labels[status] ?? status;
  }

  toggle(contractId: string): void {
    this.selectedContractId =
      this.selectedContractId === contractId ? null : contractId;
  }

  getFullName(user?: User): string {
    if (!user) return '-';
    return `${user.nombres} ${user.apellidos}`;
  }

  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { this.page++; }

  cancel(contractId: string): void {
    const confirmed = confirm('¿Estás seguro de cancelar este contrato?');
    if (!confirmed) return;

    this.loading = true;

    this.contractsService.cancelContract(contractId)
      .subscribe({
        next: () => {
          this.loading = false;
          this.loadContracts();
        },
        error: (err) => {
          this.loading = false;
          alert(err.message || 'Error al cancelar contrato');
        }
      });
  }
}
