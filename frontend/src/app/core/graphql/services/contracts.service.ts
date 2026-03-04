import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { filter, map, Observable } from 'rxjs';

import { GET_CONTRACTS } from '../queries/get-contracts.query';
import { GET_CONTRACT_BY_ID } from '../queries/get-contract-by-id.query';
import { CANCEL_CONTRACT_MUTATION } from '../mutations/cancel-contract.mutation';
import { EnergyContract } from '../models/energy-contract.model';

@Injectable({ providedIn: 'root' })
export class ContractsService {
  constructor(private apollo: Apollo) { }

  getContracts(): Observable<EnergyContract[]> {
    return this.apollo
      .watchQuery<{ getEnergyContracts: EnergyContract[] }>({
        query: GET_CONTRACTS,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        pollInterval: 10000,
      })
      .valueChanges.pipe(
        map(res => (res.data?.getEnergyContracts ?? []) as EnergyContract[]),
      );
  }

  getContractById(contractId: string): Observable<EnergyContract> {
    return this.apollo
      .watchQuery<any>({
        query: GET_CONTRACT_BY_ID,
        variables: { contractId },
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        pollInterval: 10000,
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

  cancelContract(contractId: string) {
    return this.apollo.mutate({
      mutation: CANCEL_CONTRACT_MUTATION,
      variables: { contractId },
      refetchQueries: ['GetEnergyContracts', 'GetOpenOffers', 'MyWallet', 'DashboardEnergyFinancial'],
    });
  }
}
