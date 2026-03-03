import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsIn } from 'class-validator';

@InputType()
export class SortInput {
  @Field()
  @IsString()
  field: string;

  @Field({ defaultValue: 'DESC' })
  @IsIn(['ASC','DESC'])
  direction: 'ASC' | 'DESC';
}
