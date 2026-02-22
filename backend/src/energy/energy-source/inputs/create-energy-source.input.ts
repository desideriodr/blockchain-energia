import { InputType, Field, Float } from '@nestjs/graphql';
import { EnergySourceType } from '../graphql/energy-source-type.enum';

@InputType()
export class CreateEnergySourceInput {
  @Field(() => EnergySourceType)
  sourceType: EnergySourceType;

  @Field(() => Float)
  capacityKw: number;
  
}
