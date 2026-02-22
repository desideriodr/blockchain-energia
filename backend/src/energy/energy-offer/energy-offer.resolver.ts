import { Resolver, Query, Mutation, Args, Context, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'auth/gql-auth.guard';

import { EnergyOfferService } from './energy-offer.service';
import { EnergyOfferGQL } from './graphql/energy-offer.graphql';
import { CreateEnergyOfferInput } from './graphql/inputs/create-energy-offer.input';
import { UserGQL } from '../../users/graphql/user.type';
import { EnergyOffer } from './energy-offer.entity';

interface GqlContext {
    req: {
        user: {
            id: string;
        };
    };
}

@UseGuards(GqlAuthGuard)
@Resolver(() => EnergyOfferGQL)
export class EnergyOfferResolver {
    constructor(
        private readonly service: EnergyOfferService,
    ) { }

    @ResolveField(() => UserGQL, { nullable: true })
    async seller(@Parent() offer: EnergyOffer) {
        if (!offer.sellerWallet?.user) {
            return null;
        }

        return {
            id: offer.sellerWallet.user.id,
            nombres: offer.sellerWallet.user.nombres,
            apellidos: offer.sellerWallet.user.apellidos,
        };
    }

    @Query(() => [EnergyOfferGQL])
    async openEnergyOffers() {
        return this.service.getOpenOffers();
    }

    @Query(() => [EnergyOfferGQL])
    async myEnergyOffers(@Context() ctx: GqlContext) {
        return this.service.getMyOffers(ctx.req.user.id);
    }

    @Mutation(() => EnergyOfferGQL)
    createEnergyOffer(
        @Args('input') input: CreateEnergyOfferInput,
        @Context() ctx: GqlContext,
    ) {
        return this.service.createOffer(
            ctx.req.user.id,
            input.pricePerKwhCop.toString(),
        );
    }

    @Mutation(() => EnergyOfferGQL)
    cancelEnergyOffer(
        @Args('offerId') offerId: string,
        @Context() ctx: GqlContext,
    ) {
        return this.service.cancelOffer(ctx.req.user.id, offerId);
    }

}
