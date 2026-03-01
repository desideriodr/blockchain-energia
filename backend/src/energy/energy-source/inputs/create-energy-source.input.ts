import { InputType, Field, Float } from '@nestjs/graphql';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { EnergySourceType } from '../graphql/energy-source-type.enum';

@InputType()
export class CreateEnergySourceInput {
  @IsEnum(EnergySourceType)
  @Field(() => EnergySourceType)
  sourceType: EnergySourceType;

  @IsNumber()
  @IsPositive()
  @Field(() => Float)
  capacityKw: number;
  
}
