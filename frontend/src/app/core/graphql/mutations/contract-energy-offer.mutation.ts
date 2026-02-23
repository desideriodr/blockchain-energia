import { gql } from 'apollo-angular';

export const CONTRACT_OFFER = gql`
  mutation contractOffer($input: ContractEnergyInput!) {
    contractOffer(input: $input) {
      id
      status
      pricePerKwhCop
      startDate
      endDate

      sellerWallet {
        user {
          id
          nombres
          apellidos
        }
      }

      buyerWallet {
        user {
          id
          nombres
          apellidos
        }  
      }
    }
  }
`;