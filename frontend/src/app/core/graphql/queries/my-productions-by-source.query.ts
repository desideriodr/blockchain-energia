import { gql } from "apollo-angular";

export const GET_MY_PRODUCTIONS_BY_SOURCE = gql`
  query GetMyProductionsBySource {
    myProductionsBySource {
      sourceId
      sourceType
      capacityKw
      availableKwh
      productionCount
    }
  }
`;
