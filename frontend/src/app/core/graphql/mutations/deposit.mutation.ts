import { gql } from 'apollo-angular';

export const DEPOSIT_MUTATION = gql`
  mutation DepositCOP($amount: Int!) {
    depositCOP(amount: $amount) {
      address
      balanceCop
      energyStored
    }
  }
`;
