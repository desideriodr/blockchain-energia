import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class ContractEnergyInput {

  @Field(() => ID)
  @IsUUID()
  offerId: string;
}