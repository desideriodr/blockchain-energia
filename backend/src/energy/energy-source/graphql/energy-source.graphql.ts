import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { EnergySourceType } from './energy-source-type.enum';

@ObjectType()
export class EnergySourceGQL {
  @Field(() => ID)
  id: string;

  @Field(() => EnergySourceType)
  sourceType: EnergySourceType;

  @Field(() => Float)
  capacityKw: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;
}
