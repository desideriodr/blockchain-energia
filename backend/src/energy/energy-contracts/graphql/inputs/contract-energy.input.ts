import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class ContractEnergyInput {

  @Field(() => ID)
  offerId: string;
}
