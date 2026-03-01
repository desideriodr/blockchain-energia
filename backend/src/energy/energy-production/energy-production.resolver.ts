import { Resolver, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../auth/gql-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';

import { User } from '../../users/user.entity';

import { ProductionDashboardGQL } from '../../application/dashboard/graphql/dashboard-production.graphql';

import { EnergyProductionService } from './energy-production.service';


@Resolver()
export class EnergyProductionResolver {
  constructor(
    private readonly productionService: EnergyProductionService,
  ) { }

  @UseGuards(GqlAuthGuard)
  @Query(() => ProductionDashboardGQL)
  productionDashboard(
    @CurrentUser() user: User,
    @Context() ctx,
  ) {
    const loader = ctx?.loaders?.productionBySourceLoader ?? null;
    return this.productionService.getProductionDashboard(user, loader);
  }
}
