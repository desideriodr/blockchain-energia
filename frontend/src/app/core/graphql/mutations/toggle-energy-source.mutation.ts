import { gql } from 'apollo-angular';

export const TOGGLE_ENERGY_SOURCE = gql`
  mutation ToggleEnergySource($sourceId: ID!) {
    toggleEnergySource(sourceId: $sourceId) {
      id
      isActive
    }
  }
`;
