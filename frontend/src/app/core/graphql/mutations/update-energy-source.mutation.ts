import { gql } from 'apollo-angular';

export const UPDATE_ENERGY_SOURCE = gql`
  mutation UpdateEnergySource($input: UpdateEnergySourceInput!) {
    updateEnergySource(input: $input) {
      id
      sourceType
      capacityKw
      isActive
    }
  }
`;
