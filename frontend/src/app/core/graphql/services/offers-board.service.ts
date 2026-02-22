import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { GET_OPEN_OFFERS } from '../queries/get-open-offers.query';
import { CREATE_ENERGY_OFFER } from '../mutations/create-energy-offer.mutation';
import { CONTRACT_OFFER } from '../mutations/contract-energy-offer.mutation';
import { EnergyOffer } from '../models/energy-offer.model';
import { CreateEnergyOfferInput } from '../inputs/create-energy-offer.input';
import { ContractEnergyInput } from '../inputs/contract-energy.input';

@Injectable({ providedIn: 'root' })
export class OffersBoardService {
  constructor(private apollo: Apollo) {}

  getOpenOffers(): Observable<EnergyOffer[]> {
    return this.apollo
      .watchQuery<{ openEnergyOffers: EnergyOffer[] }>({
        query: GET_OPEN_OFFERS,
        pollInterval: 5000,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map(res => res.data?.openEnergyOffers ?? []),
        map(offers => offers.filter((ofr): ofr is EnergyOffer => ofr !== undefined))
    );
  }

  createOffer(input: CreateEnergyOfferInput) {
    return this.apollo.mutate({
      mutation: CREATE_ENERGY_OFFER,
      variables: { input },
      refetchQueries: ['GetOpenOffers'],
    });
  }

  contractOffer(input: ContractEnergyInput) {
    return this.apollo.mutate({
      mutation: CONTRACT_OFFER,
      variables: { input },
      refetchQueries: ['GetOpenOffers'],
    });
  }
}

