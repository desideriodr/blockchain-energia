import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsEnum, IsNumber, IsPositive, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { EnergySourceType } from '../graphql/energy-source-type.enum';

@InputType()
export class UpdateEnergySourceInput {
  @IsUUID()
  @Field(() => ID)
  id: string;

  @IsEnum(EnergySourceType)
  @Field(() => EnergySourceType)
  sourceType: EnergySourceType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Field(() => Float, { nullable: true })
  capacityKw?: number;

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  isActive?: boolean;
}
