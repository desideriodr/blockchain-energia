import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ContractStatus } from './dto/energy-contract.enums';
import { EnergyConsumptionGQL } from 'energy/energy-consumption/graphql/energy-consumption.graphql';
import { WalletUserGQL } from 'finance/wallet/graphql/wallet-user.graphql';


@ObjectType()
export class EnergyContractGQL {

  @Field(() => ID)
  id: string;

  @Field(() => WalletUserGQL)
  sellerWallet: WalletUserGQL;

  @Field(() => WalletUserGQL)
  buyerWallet: WalletUserGQL;

  @Field({ nullable: true })
  contractAddress?: string;

  @Field()
  pricePerKwhCop: string;

  @Field()
  sourceType: string;

  @Field(() => ContractStatus)
  status: ContractStatus;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field(() => [EnergyConsumptionGQL], { nullable: true })
  consumptions?: EnergyConsumptionGQL[];
}
