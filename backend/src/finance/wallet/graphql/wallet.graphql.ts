import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class WalletGQL {
  @Field()
  address: string;

  @Field(() => Float)
  balanceCop: number;

  @Field(() => Float)
  energyStored: number;

}
