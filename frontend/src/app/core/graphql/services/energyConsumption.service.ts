import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { CONSUME_ENERGY } from '../mutations/consume-energy.mutation';
import { ConsumeEnergyInput } from '../inputs/consume-energy.input';
import { EnergyContract } from '../models/energy-contract.model';

@Injectable({ providedIn: 'root' })
export class EnergyConsumptionService {
  constructor(private apollo: Apollo) {}

  consumeEnergy(input: ConsumeEnergyInput) {
    return this.apollo.mutate<{ consumeEnergy: EnergyContract }>({
      mutation: CONSUME_ENERGY,
      variables: { input },
    });
  }
}
