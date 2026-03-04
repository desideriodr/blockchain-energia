import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';

import { GET_OPEN_OFFERS } from '../queries/get-open-offers.query';
import { GET_MY_PRODUCTIONS_BY_SOURCE } from '../queries/my-productions-by-source.query';
import { CREATE_ENERGY_OFFER } from '../mutations/create-energy-offer.mutation';
import { CONTRACT_OFFER } from '../mutations/contract-energy-offer.mutation';

import { EnergyOffer, ProductionSummaryBySource } from '../models/energy-offer.model';
import { CreateEnergyOfferInput } from '../inputs/create-energy-offer.input';
import { ContractEnergyInput } from '../inputs/contract-energy.input';

@Injectable({ providedIn: 'root' })
export class OffersBoardService {
  constructor(private apollo: Apollo) {}

  getOpenOffers(): Observable<EnergyOffer[]> {
    return this.apollo
      .watchQuery<{ openEnergyOffers: EnergyOffer[] }>({
        query: GET_OPEN_OFFERS,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map(res => (res.data?.openEnergyOffers ?? []) as EnergyOffer[]),
      );
  }

  getMyProductionsBySource(): Observable<ProductionSummaryBySource[]> {
    return this.apollo
      .watchQuery<{ myProductionsBySource: ProductionSummaryBySource[] }>({
        query: GET_MY_PRODUCTIONS_BY_SOURCE,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map(res => (res.data?.myProductionsBySource ?? []) as ProductionSummaryBySource[]),
      );
  }

  createOffer(input: CreateEnergyOfferInput) {
    return this.apollo.mutate({
      mutation: CREATE_ENERGY_OFFER,
      variables: { input },
      refetchQueries: ['GetOpenOffers', 'GetMyProductionsBySource'],
    });
  }

  contractOffer(input: ContractEnergyInput) {
    return this.apollo.mutate({
      mutation: CONTRACT_OFFER,
      variables: { input },
      refetchQueries: ['GetOpenOffers', 'GetEnergyContracts', 'MyWallet', 'DashboardEnergyFinancial'],
    });
  }
}
