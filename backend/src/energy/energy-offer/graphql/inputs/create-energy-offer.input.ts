import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNumber, IsPositive } from 'class-validator';

@InputType()
export class CreateEnergyOfferInput {

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  pricePerKwhCop: number;

}
