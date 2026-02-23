import { Resolver, Mutation, Args, Context, Query, ResolveField, Parent } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';

import { EnergyContractService } from './energy-contracts.service';
import { EnergyContractGQL } from './graphql/energy-contract.graphql';
import { EnergyContract } from './energy-contracts.entity';
import { GqlAuthGuard } from '../../auth/gql-auth.guard';
import { ContractEnergyInput } from './graphql/inputs/contract-energy.input';
import { EnergyConsumptionGQL } from 'energy/energy-consumption/graphql/energy-consumption.graphql';
import { UserContractsGQL } from './graphql/user-contracts.graphql';
import { CurrentUser } from 'auth/current-user.decorator';


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
    console.log('Searching contract with id:', contract.id, 'Found:', contract); // temporal para depurar
    if (!contract) {
      throw new Error('Service returned undefined');
    }
    return this.toGQL(contract);
  }

  private toGQL(contract: EnergyContract): EnergyContractGQL {
    return {
      id: contract.id,

      sellerWallet: {
        address: contract.sellerWallet.address,
        balanceCop: Number(contract.sellerWallet.balanceCop),
        energyStored: Number(contract.sellerWallet.energyStored),

        user: {
          id: contract.sellerWallet.user.id,
          nombres: contract.sellerWallet.user.nombres,
          apellidos: contract.sellerWallet.user.apellidos,
        },
      },

      buyerWallet: {
        address: contract.buyerWallet.address,
        balanceCop: Number(contract.buyerWallet.balanceCop),
        energyStored: Number(contract.buyerWallet.energyStored),

        user: {
          id: contract.buyerWallet.user.id,
          nombres: contract.buyerWallet.user.nombres,
          apellidos: contract.buyerWallet.user.apellidos,
        },
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
  @Query(() => [UserContractsGQL])
  async getEnergyContracts(@Context() ctx): Promise<UserContractsGQL[]> {
    const userId = ctx.req.user.id;

    const contracts = await this.service.findContractsByUser(userId);

    return contracts.map(contract => this.toUserContractsGQL(contract));
  }

  private toUserContractsGQL(contract: EnergyContract): UserContractsGQL {
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

  @UseGuards(GqlAuthGuard)
  @Mutation(() => EnergyContractGQL)
  async cancelContract(
    @Args('contractId') contractId: string,
    @CurrentUser() user: any,
  ): Promise<EnergyContract> {
    return this.service.cancelContract(
      contractId,
      user.id,
    );
  }
}
