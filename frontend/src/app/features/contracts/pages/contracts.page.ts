import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  contracts$!: Observable<EnergyContract[]>; // Observable solo con contratos activos
  loading = false;
  selectedContractId: string | null = null;

  page = 1;
  pageSize = 10;

  constructor(private contractsService: ContractsService) { }

  ngOnInit(): void {
    this.loadContracts();
  }

  /** Carga contratos activos desde el servicio */
  loadContracts(): void {
    this.contracts$ = this.contractsService.getContracts().pipe(
      map(contracts => contracts.filter(c => c.status === 'ACTIVE'))
    );
  }

  /** Abre / cierra el detalle inline */
  toggle(contractId: string): void {
    this.selectedContractId =
      this.selectedContractId === contractId ? null : contractId;
  }

  /** Nombre completo del usuario */
  getFullName(user?: User): string {
    if (!user) return '-';
    return `${user.nombres} ${user.apellidos}`;
  }

  /** Paginación */
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { this.page++; }

  /** Cancela un contrato y recarga la lista de contratos activos */
  cancel(contractId: string): void {
    const confirmed = confirm('¿Estás seguro de cancelar este contrato?');
    if (!confirmed) return;

    this.loading = true;

    this.contractsService.cancelContract(contractId)
      .subscribe({
        next: () => {
          this.loading = false;
          // Recarga los contratos activos
          this.loadContracts();
        },
        error: (err) => {
          this.loading = false;
          alert(err.message || 'Error al cancelar contrato');
        }
      });
  }
}