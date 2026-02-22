import { gql } from 'apollo-angular';

export const CREATE_ENERGY_OFFER = gql`
  mutation CreateEnergyOffer($input: CreateEnergyOfferInput!) {
    createEnergyOffer(input: $input) {
      id
      pricePerKwhCop
      status
    }
  }
`;