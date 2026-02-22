import { Resolver, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { WalletService } from './wallet.service';
import { Wallet } from './wallet.entity';
import { GqlAuthGuard } from '../../auth/gql-auth.guard';

import { WalletGQL } from './graphql/wallet.type';

@Resolver(() => WalletGQL)
export class WalletResolver {

  constructor(
    private readonly walletService: WalletService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => WalletGQL)
  async myWallet(@Context() ctx): Promise<WalletGQL> {

    const userId = ctx.req.user.id;

    const wallet = await this.walletService.getWalletByUser(userId);

    return this.toWalletGQL(wallet);
  }

  /* ============================================
     MAPPERS
  ============================================ */

  private toWalletGQL(wallet: Wallet): WalletGQL {
    return {
      address: wallet.address,
      balanceCop: Number(wallet.balanceCop),
      energyStored: Number(wallet.energyStored)
    };
  }
}
