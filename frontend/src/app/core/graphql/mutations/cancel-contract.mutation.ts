import { gql } from 'apollo-angular';

export const CANCEL_CONTRACT_MUTATION = gql`
  mutation CancelContract($contractId: String!) {
    cancelContract(contractId: $contractId) {
      id
      status
      isActive
    }
  }
`;