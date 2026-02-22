import { gql } from 'apollo-angular';

export const MY_ENERGY_SOURCES = gql`
  query MyEnergySources {
    myEnergySources {
      id
      sourceType
      capacityKw
      isActive
      createdAt
    }
  }
`;
