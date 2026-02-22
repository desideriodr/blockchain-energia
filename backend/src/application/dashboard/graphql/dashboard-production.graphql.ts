import { ObjectType, Field, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class ProductionSourceMetricsGQL {
  @Field(() => ID)
  sourceId: number;

  @Field()
  sourceType: string;

  @Field(() => Float)
  capacityKw: number;

  @Field(() => Float)
  producedTotal: number;

  @Field(() => Float)
  producedToday: number;
}

@ObjectType()
export class ProductionDashboardGQL {
  @Field(() => Float)
  energyStored: number;

  @Field(() => [ProductionSourceMetricsGQL])
  sources: ProductionSourceMetricsGQL[];
}
