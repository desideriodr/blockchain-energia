import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class HourlyFinancial {
  @Field()
  hour: string;

  @Field(() => Float)
  incomeCOP: number;

  @Field(() => Float)
  expenseCOP: number;
}

@ObjectType()
export class HourlyEnergy {
  @Field()
  hour: string;

  @Field(() => Float)
  productionKwh: number;

  @Field(() => Float)
  consumptionKwh: number;
}

@ObjectType()
export class DailyEnergy {
  @Field()
  day: string;

  @Field(() => Float)
  productionKwh: number;

  @Field(() => Float)
  consumptionKwh: number;
}

@ObjectType()
export class ContractsCount {
  @Field()
  contractedOffers: string;

  @Field(() => Float)
  activeContracts: string;
}

@ObjectType()
export class EnergySourceDistribution {
  @Field()
  sourceType: string;

  @Field(() => Float)
  productionKwh: number;

  @Field(() => Float)
  capacityKw: number;
}

@ObjectType()
export class DashboardEnergyFinancial {
  @Field(() => [HourlyFinancial])
  hourlyFinancial: HourlyFinancial[];

  @Field(() => [HourlyEnergy])
  hourlyEnergy: HourlyEnergy[];

  @Field(() => [DailyEnergy])
  monthlyEnergy: DailyEnergy[];

  @Field(() => [EnergySourceDistribution])
  sourceDistribution: EnergySourceDistribution[];

  @Field(() => [ContractsCount])
  contractsCount: ContractsCount[];
}