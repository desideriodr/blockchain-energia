import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class WalletSummaryGQL {
  @Field()
  address: string;

  @Field(() => Float)
  balanceCop: number;

  @Field(() => Float)
  energyStored: number;

}
