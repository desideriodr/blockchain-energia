import { gql } from 'apollo-angular';

export const WITHDRAW_MUTATION = gql`
  mutation WithdrawCOP($amount: Int!) {
    withdrawCOP(amount: $amount) {
      address
      balanceCop
      energyStored
    }
  }
`;
