import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { MY_TRANSACTIONS_QUERY } from '../queries/my-transactions.query';
import { WalletTransactionPage } from '../models/transaction-page.model';

import { WITHDRAW_MUTATION } from '../mutations/withdraw.mutation';
import { DEPOSIT_MUTATION } from '../mutations/deposit.mutation';
import { Wallet } from '../models/energy-contract.model';

@Injectable({
  providedIn: 'root',
})
export class WalletTransactionService {

  constructor(private apollo: Apollo) { }

  getMyTransactions(options: {
    limit: number;
    offset: number;
    type?: string;
    from?: string;
    to?: string;
  }): Observable<WalletTransactionPage> {

    return this.apollo
      .query<{ myTransactions: WalletTransactionPage }>({
        query: MY_TRANSACTIONS_QUERY,
        variables: {
          limit: options.limit,
          offset: options.offset,
          type: options.type,
          from: options.from,
          to: options.to
        },
        fetchPolicy: 'network-only'
      })
      .pipe(
        map(result => {
          if (!result.data) {
            throw new Error('Sin datos');
          }
          return result.data.myTransactions;
        })
      );
  }

  depositCop(amount: number): Observable<Wallet> {
    return this.apollo
      .mutate({
        mutation: DEPOSIT_MUTATION,
        variables: { amount },
      })
      .pipe(map((res: any) => res.data.depositCOP));
  }

  withdrawCop(amount: number): Observable<Wallet> {
    return this.apollo
      .mutate({
        mutation: WITHDRAW_MUTATION,
        variables: { amount },
      })
      .pipe(map((res: any) => res.data.withdrawCOP));
  }
}