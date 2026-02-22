import { ObjectType, Field, ID } from '@nestjs/graphql';
import { EnergyContractGQL } from 'energy/energy-contracts/graphql/energy-contract.graphql';

@ObjectType()
export class EnergyConsumptionGQL {

  @Field(() => ID)
  id: string;

  @Field()
  energyKwhConsumed: string;

  @Field()
  costCop: string;

  @Field()
  recordedAt: Date;

  @Field(() => EnergyContractGQL)
  contract: EnergyContractGQL;
}
