import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserGQL } from 'users/graphql/user.type';
import { EnergyOfferStatus } from './dto/energy-offer.enums';


@ObjectType()
export class EnergyOfferGQL {
  @Field()
  id: string;

  @Field()
  pricePerKwhCop: number;

  @Field(() => Int)
  contractDurationMonths: number;

  @Field(() => EnergyOfferStatus)
  status: EnergyOfferStatus;

  @Field()
  createdAt: Date;

  @Field(() => UserGQL)
  seller: UserGQL;
}
