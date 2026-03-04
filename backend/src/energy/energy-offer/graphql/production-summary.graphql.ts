import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class ProductionSummaryBySourceGQL {
  @Field()
  sourceId: string;

  @Field()
  sourceType: string;

  @Field(() => Float)
  capacityKw: number;

  @Field(() => Float)
  availableKwh: number;

  @Field(() => Int)
  productionCount: number;
}
