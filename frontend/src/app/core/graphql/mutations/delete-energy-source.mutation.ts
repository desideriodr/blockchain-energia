import { gql } from 'apollo-angular';

export const DELETE_ENERGY_SOURCE = gql`
  mutation DeleteEnergySource($id: ID!) {
    deleteEnergySource(id: $id)
  }
`;
