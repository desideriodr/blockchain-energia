import { gql } from 'apollo-angular';

export const ME_SUMMARY_QUERY = gql`
  query MeSummary {
    meSummary {
      userId
      email
      nombres
      apellidos
      role
      wallet {
        address
        balanceCop
        energyStored
      }
    }
  }
`;