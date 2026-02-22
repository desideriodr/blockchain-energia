import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class DashboardKPI {
  @Field(() => Float)
  totalEnergyProduced: number;

  @Field(() => Int)
  totalTransactions: number;

  @Field(() => Float)
  totalEnergyTransferred: number;
}
