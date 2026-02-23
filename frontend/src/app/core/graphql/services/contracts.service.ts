import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { filter, map, Observable } from 'rxjs';

import { GET_CONTRACTS } from '../queries/get-contracts.query';
import { GET_CONTRACT_BY_ID } from '../queries/get-contract-by-id.query';

import { EnergyContract, Wallet, User } from '../models/energy-contract.model';
import { EnergyConsumption } from '../models/energy-consumption.model';

@Injectable({ providedIn: 'root' })
export class ContractsService {
  constructor(private apollo: Apollo) { }

  /** Obtener los contratos del usuario y mapear buyer/seller desde los wallets */
  getContracts(): Observable<EnergyContract[]> {
    return this.apollo
      .watchQuery<{ getEnergyContracts: EnergyContract[] }>({
        query: GET_CONTRACTS,
        pollInterval: 5000,
      })
      .valueChanges.pipe(
        map(res => res.data?.getEnergyContracts ?? []),
        map(contracts => contracts.filter((c): c is EnergyContract => c !== undefined)))
  }

  /** Obtener un contrato por ID y mapear buyer/seller */
  getContractById(contractId: string): Observable<EnergyContract> {

    return this.apollo
      .watchQuery<any>({
        query: GET_CONTRACT_BY_ID,
        variables: { contractId },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(

        filter(res => !res.loading),

        map(res => {

          if (!res.data?.energyContract) {
            throw new Error('energyContract missing in response');
          }

          return res.data.energyContract;
        })
      );
  }
}
