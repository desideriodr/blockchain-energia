import {
  Resolver,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { EnergyConsumptionService, ConsumptionAction } from './energy-consumption.service';
import { EnergyConsumptionGQL } from './graphql/energy-consumption.graphql';
import { GqlAuthGuard } from '../../auth/gql-auth.guard';
import { EnergyContractGQL } from 'energy/energy-contracts/graphql/energy-contract.graphql';
import { EnergyConsumption } from './energy-consumption.entity';

@Resolver(() => EnergyConsumptionGQL)
export class EnergyConsumptionResolver {
  constructor(
    private readonly service: EnergyConsumptionService,
  ) {}

  /* ================= RELATIONS ================= */

  @ResolveField(() => EnergyContractGQL, { nullable: true })
  async contract(@Parent() consumption: EnergyConsumption) {
    return consumption.contract;
  }

  /* ================= MUTATION ================= */

  @UseGuards(GqlAuthGuard)
  @Mutation(() => EnergyConsumptionGQL, { nullable: true })
  async reportConsumption(
    @Args('contractId') contractId: string,
    @Args('kwhConsumed') kwhConsumed: number,
  ): Promise<EnergyConsumptionGQL | null> {

    const result = await this.service.reportConsumption(
      contractId,
      kwhConsumed,
    );

    if (!result) {
      return null;
    }

    if (result.action === ConsumptionAction.REPORT) {

      const consumption = result.consumption;

      return {
        id: consumption.id,
        energyKwhConsumed: consumption.energyKwhConsumed,
        costCop: consumption.costCop,
        recordedAt: consumption.recordedAt,
      };
    }

    return null;
  }
}