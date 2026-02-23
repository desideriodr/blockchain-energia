import { ObjectType, Field, ID } from '@nestjs/graphql';
import { WalletSummaryGQL } from 'finance/wallet/graphql/wallet-summary.graphql';


@ObjectType()
export class MeSummary {
  @Field(() => ID)
  userId: string;

  @Field()
  email: string;

  @Field()
  nombres: string;

  @Field()
  apellidos: string;

  @Field()
  role: string;

  @Field(() => WalletSummaryGQL)
  wallet: WalletSummaryGQL;
}
