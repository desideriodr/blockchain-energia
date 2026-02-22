import { gql } from 'apollo-angular';

export const GET_CONTRACT_BY_ID = gql`
  query GetContractById($contractId: String!) {
    energyContract(contractId: $contractId) {
      id
      consumptions {
        id
        energyKwhConsumed
        costCop
        recordedAt
      }
    }
  }
`;
