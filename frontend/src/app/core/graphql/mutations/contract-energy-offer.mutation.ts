import { gql } from 'apollo-angular';

export const CONTRACT_OFFER = gql`
  mutation contractOffer($input: ContractEnergyInput!) {
    contractOffer(input: $input) {
      id
      status
      pricePerKwhCop
      startDate
      endDate

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