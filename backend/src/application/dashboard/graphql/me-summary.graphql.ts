import { ObjectType, Field, ID } from '@nestjs/graphql';
import { WalletGQL } from 'finance/wallet/graphql/wallet.type';

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

  @Field(() => WalletGQL)
  wallet: WalletGQL;
}
