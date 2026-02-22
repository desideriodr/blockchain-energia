import { Resolver, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardKPI } from '../analytics/graphql/dashboard-kpi.graphql';
import { DashboardHome } from './graphql/dashboard-home.graphql';
import { GqlAuthGuard } from 'auth/gql-auth.guard';
import { MeSummary } from './graphql/me-summary.graphql';
import { WalletService } from 'finance/wallet/wallet.service';
import { UsersService } from 'users/users.service';

@Resolver()
export class DashboardResolver {

  constructor(
    private readonly dashboardService: DashboardService,

    private readonly usersService: UsersService,
    
    private readonly walletService: WalletService,
  ) { }

  @UseGuards(GqlAuthGuard)
  @Query(() => DashboardHome)
  async dashboardHome(@Context() context): Promise<DashboardHome> {
    const userId = context.req.user.id;
    return this.dashboardService.getDashboardHome(userId);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => MeSummary)
  async meSummary(@Context() ctx): Promise<MeSummary> {

    const userId = ctx.req.user.id;

    const user = await this.usersService.findById(userId);
    const wallet = await this.walletService.getWalletByUser(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      nombres: user.nombres ?? '',
      apellidos: user.apellidos ?? '',
      role: user.role,
      wallet: {
        address: wallet.address,
        balanceCop: Number(wallet.balanceCop),
        energyStored: Number(wallet.energyStored)
      }
    };
  }
}
