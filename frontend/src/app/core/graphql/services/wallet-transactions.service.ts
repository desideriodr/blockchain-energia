import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MY_TRANSACTIONS_QUERY } from '../queries/my-transactions.query';
import { WalletTransaction } from '../models/transaction.model';
import { WITHDRAW_MUTATION } from '../mutations/withdraw.mutation';
import { Wallet } from '../models/energy-contract.model';
import { DEPOSIT_MUTATION } from '../mutations/deposit.mutation';

@Injectable({
  providedIn: 'root',
})
export class WalletTransactionService {

  private txQueryRef!: QueryRef<{ myTransactions: WalletTransaction[] }>;

  constructor(private apollo: Apollo) { }

  getMyTransactions(type?: string): Observable<WalletTransaction[]> {

  this.txQueryRef = this.apollo.watchQuery<{
    myTransactions: WalletTransaction[];
  }>({
    query: MY_TRANSACTIONS_QUERY,
    variables: { type },
    fetchPolicy: 'network-only'
  });

  return this.txQueryRef.valueChanges.pipe(
    filter(result => !!result.data?.myTransactions),
    map(result => result.data!.myTransactions as WalletTransaction[])
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
