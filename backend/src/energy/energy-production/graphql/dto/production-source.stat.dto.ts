import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class ProductionSourceStat {
  @Field()
  id: string;

  @Field()
  sourceType: string;

  @Field()
  capacityKw: number;

  @Field()
  isActive: boolean;

  @Field()
  producedTotal: number;

  @Field()
  producedToday: number;
}

@ObjectType()
class ProductionDashboard {
  @Field()
  energyStored: number;

  @Field(() => [ProductionSourceStat])
  sources: ProductionSourceStat[];
}
