import { Resolver, Mutation, Args, Context, Query, ResolveField, Parent } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';

import { EnergyContractService } from './energy-contracts.service';
import { EnergyContractGQL } from './graphql/energy-contract.graphql';
import { EnergyContract } from './energy-contracts.entity';
import { GqlAuthGuard } from '../../auth/gql-auth.guard';
import { ContractEnergyInput } from './graphql/inputs/contract-energy.input';
import { EnergyConsumptionGQL } from 'energy/energy-consumption/graphql/energy-consumption.graphql';
import { User } from 'users/user.entity';

@Resolver(() => EnergyContractGQL)
export class EnergyContractResolver {
  constructor(
    private readonly service: EnergyContractService,
  ) { }

  @UseGuards(GqlAuthGuard)
  @ResolveField(() => [EnergyConsumptionGQL])
  async consumptions(@Parent() contract: EnergyContractGQL, @Context() ctx) {
    const userId = ctx.req.user.id;
    return this.service.findConsumptionsByContract(contract.id, userId);
  }

  /**
   * Contratar una oferta energética P2P
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => EnergyContractGQL)
  async contractOffer(
    @Context() ctx,
    @Args('input') input: ContractEnergyInput,
  ): Promise<EnergyContractGQL> {
    const userId = ctx.req.user.id;

    const contract = await this.service.contractOffer(userId, input.offerId);
    if (!contract) {
      throw new Error('Service returned undefined');
    }
    return this.toGQL(contract);
  }

  /**
   * Mapper Entidad → DTO GraphQL
   */
  private toGQL(contract: EnergyContract): EnergyContractGQL {
    return {
      id: contract.id,

      seller: {
        id: contract.sellerWallet.user.id,
        nombres: contract.sellerWallet.user.nombres,
        apellidos: contract.sellerWallet.user.apellidos,
      },

      buyer: {
        id: contract.buyerWallet.user.id,
        nombres: contract.buyerWallet.user.nombres,
        apellidos: contract.buyerWallet.user.apellidos,
      },

      contractAddress: contract.contractAddress ?? null,

      pricePerKwhCop: contract.pricePerKwhCop,

      status: contract.status,

      startDate: contract.startDate,
      endDate: contract.endDate,

      isActive: contract.isActive,
    };
  }


  @UseGuards(GqlAuthGuard)
  @Query(() => [EnergyContractGQL])
  async myEnergyContracts(@Context() ctx): Promise<EnergyContractGQL[]> {
    const userId = ctx.req.user.id;

    const contracts = await this.service.findContractsByUser(userId);

    return contracts.map(contract => this.toGQL(contract));
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => EnergyContractGQL, { name: 'energyContract' })
  async getContractById(
    @Args('contractId') contractId: string,
    @Context() ctx,
  ): Promise<EnergyContractGQL> {
    const userId = ctx.req.user.id;

    const contract = await this.service.findContractById(contractId, userId);

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    return this.toGQL(contract);
  }
}
