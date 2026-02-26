import { gql } from 'apollo-angular';

export const MY_TRANSACTIONS_QUERY = gql`
  query MyTransactions(
    $type: TxType
    $limit: Int
    $offset: Int
  ) {
    myTransactions(
      type: $type
      limit: $limit
      offset: $offset
    ) {
      total
      limit
      offset
      data {
        id
        fromAddress
        toAddress
        grossAmountCop
        feeCOP
        amountCop
        type
        createdAt
      }
    }
  }
`;