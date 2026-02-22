import { InputType, Field, Int } from '@nestjs/graphql';
import { SortInput } from './sort.input';
import { TxType } from '../../wallet-transactions.entity';

@InputType()
export class TransactionFilterInput {
  @Field(() => TxType, { nullable: true })
  type?: TxType;

  @Field({ nullable: true })
  fromAddress?: string;

  @Field({ nullable: true })
  toAddress?: string;

  @Field(() => Int, { defaultValue: 20 })
  limit?: number;

  @Field(() => Int, { defaultValue: 0 })
  offset?: number;

  @Field(() => SortInput, { nullable: true })
  sort?: SortInput;
}
