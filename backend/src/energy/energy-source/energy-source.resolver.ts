import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { GqlAuthGuard } from 'auth/gql-auth.guard';
import { CurrentUser } from 'auth/current-user.decorator';
import { User } from 'users/user.entity';

import { EnergySourceService } from './energy-source.service';
import { EnergySourceGQL } from './graphql/energy-source.graphql';
import { CreateEnergySourceInput } from './inputs/create-energy-source.input';
import { UpdateEnergySourceInput } from './inputs/update-energy-source.input';
import { EnergySource } from './energy-source.entity';

@Resolver(() => EnergySourceGQL)
export class EnergySourceResolver {
  constructor(
    private readonly energySourceService: EnergySourceService,
  ) { }

  @UseGuards(GqlAuthGuard)
  @Query(() => [EnergySourceGQL])
  async myEnergySources(
    @CurrentUser() user: User,
  ): Promise<EnergySource[]> {
    return this.energySourceService.findByUser(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => EnergySourceGQL)
  async createEnergySource(
    @Args('input') input: CreateEnergySourceInput,
    @CurrentUser() user: User,
  ): Promise<EnergySource> {
    return this.energySourceService.create(user.id, input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => EnergySourceGQL)
  async updateEnergySource(
    @Args('input') input: UpdateEnergySourceInput,
    @CurrentUser() user: User,
  ): Promise<EnergySource> {
    return this.energySourceService.update(user.id, input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async deleteEnergySource(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.energySourceService.delete(user.id, id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => EnergySourceGQL)
  toggleEnergySource(
    @Args('sourceId', { type: () => ID }) sourceId: string,
    @CurrentUser() user: User,
  ) {
    return this.energySourceService.toggle(user.id, sourceId);
  }
}
