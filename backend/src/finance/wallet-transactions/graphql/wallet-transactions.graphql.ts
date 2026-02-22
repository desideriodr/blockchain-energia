import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { TxType } from './dto/wallet-transaction.enums';

@ObjectType()
export class WalletTransactionGQL {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  txHash?: string;

  @Field()
  fromAddress: string;

  @Field({ nullable: true })
  toAddress?: string;

  @Field(() => Float, { nullable: true })
  grossAmountCop?: number;

  @Field(() => Float, { nullable: true })
  feeCOP?: number;

  @Field(() => Float)
  amountCop: number;

  @Field(() => TxType)
  type: TxType;

  @Field()
  confirmedOnChain?: boolean;

  @Field()
  createdAt: Date;

}
