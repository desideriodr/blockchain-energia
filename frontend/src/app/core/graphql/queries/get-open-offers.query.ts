import { gql } from "apollo-angular";

export const GET_OPEN_OFFERS = gql`
  query GetOpenOffers {
    openEnergyOffers {
      id
      pricePerKwhCop
      status
      createdAt
      seller {
        id
        nombres
        apellidos
      }
    }
  }
`;