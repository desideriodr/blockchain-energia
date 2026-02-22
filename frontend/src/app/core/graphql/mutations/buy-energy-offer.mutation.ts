import { gql } from 'apollo-angular';

export const BUY_OFFER = gql`
  mutation BuyEnergy($input: BuyEnergyInput!) {
    buyEnergy(input: $input) {
      id
      status
      energyKwhAvailable
    }
  }
`;
