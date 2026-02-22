import { gql } from 'apollo-angular';

export const GET_MY_CONTRACTS = gql`
  query MyEnergyContracts {
  myEnergyContracts {
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
