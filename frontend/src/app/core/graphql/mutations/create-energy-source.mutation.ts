import { gql } from 'apollo-angular';

export const CREATE_ENERGY_SOURCE = gql`
  mutation CreateEnergySource($input: CreateEnergySourceInput!) {
    createEnergySource(input: $input) {
      id
      sourceType
      capacityKw
      isActive
    }
  }
`;
