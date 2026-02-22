import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class TimeSeriesPoint {
  @Field()
  date: string;

  @Field(() => Float)
  value: number;
}

