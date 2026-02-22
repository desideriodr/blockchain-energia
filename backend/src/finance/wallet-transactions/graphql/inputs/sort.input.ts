import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SortInput {
  @Field()
  field: string;

  @Field({ defaultValue: 'DESC' })
  direction: 'ASC' | 'DESC';
}
