import { Resolver, Mutation, Args, Context, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { EnergyConsumptionService } from './energy-consumption.service';
import { EnergyConsumptionGQL } from './graphql/energy-consumption.graphql';
import { GqlAuthGuard } from '../../auth/gql-auth.guard';
import { EnergyContractGQL } from 'energy/energy-contracts/graphql/energy-contract.graphql';
import { EnergyConsumption } from './energy-consumption.entity';

@Resolver(() => EnergyConsumptionGQL)
export class EnergyConsumptionResolver {

  constructor(
    private readonly service: EnergyConsumptionService,
  ) { }

  @ResolveField(() => EnergyContractGQL)
  async contract(@Parent() consumption: EnergyConsumption) {
    return consumption.contract;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => EnergyConsumptionGQL, { nullable: true })
  async reportConsumption(
    @Args('contractId') contractId: string,
    @Args('kwhConsumed') kwhConsumed: number,
  ): Promise<EnergyConsumptionGQL | null> {

    const consumption = await this.service.reportConsumption(
      contractId,
      kwhConsumed,
    );

    if (!consumption) {
      return null;
    }

    return {
      id: consumption.id,
      energyKwhConsumed: consumption.energyKwhConsumed,
      costCop: consumption.costCop,
      recordedAt: consumption.recordedAt,
    } as EnergyConsumptionGQL;
  }

}
