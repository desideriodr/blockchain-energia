import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsNumber, IsPositive } from 'class-validator';

@InputType()
export class ConsumeEnergyInput {
  @Field(() => ID)
  @IsUUID()
  contractId: string;

  @Field(() => Int)
  @IsNumber()
  @IsPositive()
  energyKwh: number;
}
