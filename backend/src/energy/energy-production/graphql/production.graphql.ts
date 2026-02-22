import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';
import { EnergySourceGQL } from 'energy/energy-source/graphql/energy-source.graphql';

@ObjectType()
export class EnergyProductionGQL {
  @Field(() => ID)
  id: string;

  @Field()
  producerAddress: string;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  assetId?: number;

  @Field()
  createdAt: Date;

  @Field(() => EnergySourceGQL)
  energySource: EnergySourceGQL;
}

