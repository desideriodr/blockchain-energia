import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { WalletTransactionService } from './wallet-transactions.service';
import { WalletTransactions } from './wallet-transactions.entity';
import { Wallet } from '../wallet/wallet.entity';

import { GqlAuthGuard } from '../../auth/gql-auth.guard';

import { WalletTransactionGQL } from './graphql/wallet-transactions.graphql';
import { WalletGQL } from '../wallet/graphql/wallet.graphql';
import { TimeSeriesPoint } from 'application/dashboard/graphql/time-series.graphql';
import { MeSummary } from 'application/dashboard/graphql/me-summary.graphql';
import { TxType } from './graphql/dto/wallet-transaction.enums';

@Resolver(() => WalletTransactionGQL)
export class WalletTransactionResolver {

  constructor(
    private readonly walletTxService: WalletTransactionService,
  ) {}

  /* ============================================
     TRANSACTIONS LIST
  ============================================ */

  @UseGuards(GqlAuthGuard)
  @Query(() => [WalletTransactionGQL])
  async myTransactions(
    @Context() ctx,
    @Args('type', { type: () => TxType, nullable: true }) type?: TxType,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<WalletTransactionGQL[]> {

    const userId = ctx.req.user.id;

    const result = await this.walletTxService.findMyTransactions(userId, {
      type,
      limit,
      offset,
    });

    return result.data.map(tx => this.toTxGQL(tx));
  }

  /* ============================================
     TRANSACTIONS BY DAY
  ============================================ */

  @UseGuards(GqlAuthGuard)
  @Query(() => [TimeSeriesPoint])
  async myTransactionsByDay(@Context() ctx): Promise<TimeSeriesPoint[]> {
    return this.walletTxService.getTransactionsByDay(ctx.req.user.id);
  }

  /* ============================================
     DEPOSIT COP
  ============================================ */

  @UseGuards(GqlAuthGuard)
  @Mutation(() => WalletGQL)
  async depositCOP(
    @Context() ctx,
    @Args('amount', { type: () => Int }) amount: number,
  ): Promise<WalletGQL> {

    const wallet = await this.walletTxService.depositCOP(
      ctx.req.user.id,
      amount,
    );

    return this.toWalletGQL(wallet);
  }

  /* ============================================
     WITHDRAW COP
  ============================================ */

  @UseGuards(GqlAuthGuard)
  @Mutation(() => WalletGQL)
  async withdrawCOP(
    @Context() ctx,
    @Args('amount', { type: () => Int }) amount: number,
  ): Promise<WalletGQL> {

    const wallet = await this.walletTxService.withdrawCOP(
      ctx.req.user.id,
      amount,
    );

    return this.toWalletGQL(wallet);
  }

  /* ============================================
     ME SUMMARY
  ============================================ */

  @UseGuards(GqlAuthGuard)
  @Query(() => MeSummary)
  async meSummary(@Context() ctx): Promise<MeSummary> {
    return this.walletTxService.getMeSummary(ctx.req.user);
  }

  /* ============================================
     MAPPERS
  ============================================ */

  private toTxGQL(tx: WalletTransactions): WalletTransactionGQL {
    return {
      id: tx.id,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress ?? undefined,
      amountCop: Number(tx.amountCop),
      grossAmountCop: tx.metadata?.grossAmountCop? Number(tx.metadata.grossAmountCop): 0,
      feeCOP: tx.metadata?.feeCOP? Number(tx.metadata.feeCOP): 0,
      type: tx.type,
      createdAt: tx.createdAt,
    };
  }

  private toWalletGQL(wallet: Wallet): WalletGQL {
    return {
      address: wallet.address,
      balanceCop: Number(wallet.balanceCop),
      energyStored: Number(wallet.energyStored),
    };
  }
}
