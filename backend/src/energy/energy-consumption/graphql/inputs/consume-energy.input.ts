import { InputType, Field, ID, Int } from '@nestjs/graphql';

@InputType()
export class ConsumeEnergyInput {
  @Field(() => ID)
  contractId: string;

  @Field(() => Int)
  energyKwh: number;
}
