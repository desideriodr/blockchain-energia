import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { EnergySourceType } from '../graphql/energy-source-type.enum';

@InputType()
export class UpdateEnergySourceInput {
  @Field(() => ID)
  id: string;

  @Field(() => EnergySourceType)
  sourceType: EnergySourceType;

  @Field(() => Float, { nullable: true })
  capacityKw?: number;

  @Field({ nullable: true })
  isActive?: boolean;
}
