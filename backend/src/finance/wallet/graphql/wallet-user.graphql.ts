import { ObjectType, Field, Float } from '@nestjs/graphql';
import { UserGQL } from 'users/graphql/user.type';

@ObjectType()
export class WalletUserGQL {
  @Field()
  address: string;

  @Field(() => Float)
  balanceCop: number;

  @Field(() => Float)
  energyStored: number;

  @Field(() => UserGQL)
  user: UserGQL;
}
