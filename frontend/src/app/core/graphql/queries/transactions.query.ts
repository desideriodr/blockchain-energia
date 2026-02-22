import { gql } from 'apollo-angular';

export const TRANSACTIONS_QUERY = gql`
  query Transactions($filters: TransactionFilterInput) {
    transactions(filters: $filters) {
      total
      offset
      data {
        fromAddress
        toAddress
        grossAmountCop
        feeCOP
        amountCop
        type
        createdAt
        production {
          producerAddress
          amount
          createdAt
        }
      }
    }
  }
`;
