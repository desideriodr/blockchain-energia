import { gql } from "apollo-angular";

export const CONSUME_ENERGY = gql`
  mutation ConsumeEnergy($input: ConsumeEnergyInput!) {
    consumeEnergy(input: $input) {
      id
      status
    }
  }
`;
