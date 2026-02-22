import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ContractStatus } from './dto/energy-contract.enums';
import { UserGQL } from 'users/graphql/user.type';
import { EnergyConsumptionGQL } from 'energy/energy-consumption/graphql/energy-consumption.graphql';

@ObjectType()
export class EnergyContractGQL {

  @Field(() => ID)
  id: string;

  @Field(() => UserGQL)
  seller: UserGQL;

  @Field(() => UserGQL)
  buyer: UserGQL;

  @Field({ nullable: true })
  contractAddress?: string;

  @Field()
  pricePerKwhCop: string;

  @Field(() => ContractStatus)
  status: ContractStatus;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field(() => [EnergyConsumptionGQL], { nullable: true })
  consumptions?: EnergyConsumptionGQL[];
}
