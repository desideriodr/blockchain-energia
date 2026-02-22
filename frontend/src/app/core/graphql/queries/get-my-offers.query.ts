import { gql } from "apollo-angular";

export const GET_MY_OFFERS = gql`
  query GetMyOffers {
    myEnergyOffers {
      id
      pricePerKwhCop
      status
    }
  }
`;