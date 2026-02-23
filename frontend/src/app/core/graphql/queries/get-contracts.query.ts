import { gql } from 'apollo-angular';

export const GET_CONTRACTS = gql`
  query GetEnergyContracts {
  getEnergyContracts {
    id
    status
    startDate
    endDate
    pricePerKwhCop
    seller {
      id
      nombres
      apellidos
    }
    buyer {
      id
      nombres
      apellidos
    }
  }
}
`;
