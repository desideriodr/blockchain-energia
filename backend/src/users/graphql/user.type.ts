import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserGQL {
  @Field()
  id: string;

  @Field()
  nombres: string;

  @Field()
  apellidos: string;
}
