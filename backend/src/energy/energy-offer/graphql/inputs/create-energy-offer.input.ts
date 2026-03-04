import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

@InputType()
export class CreateEnergyOfferInput {

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  pricePerKwhCop: number;

  @Field()
  @IsUUID()
  energySourceId: string;

}
