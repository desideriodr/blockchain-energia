import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './gql-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { MeSummary } from '../application/dashboard/graphql/me-summary.graphql';
import { UsersService } from '../users/users.service';
import { WalletService } from '../finance/wallet/wallet.service';


@Resolver()
export class MeResolver {
  constructor(
    private usersService: UsersService,
    private walletService: WalletService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => MeSummary)
  async meSummary(@CurrentUser() user: any): Promise<MeSummary> {
    const userData = await this.usersService.findById(user.id);
    if (!userData) {
      throw new Error('Usuario no encontrado');
    }
    const wallet = await this.walletService.getWalletByUser(user.id);

    return {
      userId: user.id,
      email: user.email,
      nombres: userData?.nombres ?? '',
      apellidos: userData?.apellidos ?? '',
      role: userData?.role ?? '',
      wallet: {
        address: wallet?.address ?? '',
        balanceCop: Number(wallet?.balanceCop ?? 0),
        energyStored: Number(wallet?.energyStored ?? 0),
      },
    };
  }
}
