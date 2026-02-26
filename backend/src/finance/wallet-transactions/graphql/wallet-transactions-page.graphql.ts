import { ObjectType, Field, Int } from '@nestjs/graphql';
import { WalletTransactionGQL } from './wallet-transactions.graphql';

@ObjectType()
export class WalletTransactionPageGQL {

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  offset: number;

  @Field(() => [WalletTransactionGQL])
  data: WalletTransactionGQL[];
}