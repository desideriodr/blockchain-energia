import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class WalletAmountInput {
  @Field(() => Float)
  amount: number;
}
