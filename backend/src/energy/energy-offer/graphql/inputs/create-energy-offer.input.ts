import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateEnergyOfferInput {

  @Field()
  pricePerKwhCop: number;

}
