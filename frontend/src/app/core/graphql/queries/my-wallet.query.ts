import { gql } from 'apollo-angular';

export const MY_WALLET_QUERY = gql`
  query MyWallet {
    myWallet {
      address
      balanceCop
      energyStored
    }
  }
`;
