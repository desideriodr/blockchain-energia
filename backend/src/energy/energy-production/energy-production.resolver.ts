import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { GqlAuthGuard } from '../../auth/gql-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { User } from '../../users/user.entity';

import { EnergyProductionService } from './energy-production.service';
import { ProductionDashboardGQL } from '../../application/dashboard/graphql/dashboard-production.graphql';

@Resolver()
export class EnergyProductionResolver {
  constructor(
    private readonly productionService: EnergyProductionService,
  ) { }

  @UseGuards(GqlAuthGuard)
  @Query(() => ProductionDashboardGQL)
  productionDashboard(
    @CurrentUser() user: User,
  ) {
    return this.productionService.getProductionDashboard(user);
  }

}
