import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { Observable, filter, map } from 'rxjs';
import { Wallet } from '../models/wallet.model';
import { MY_WALLET_QUERY } from '../queries/my-wallet.query';

@Injectable({
    providedIn: 'root',
})
export class WalletService {

    private walletQueryRef!: QueryRef<{ myWallet: Wallet }>;

    constructor(private apollo: Apollo) { }

    getMyWallet(): Observable<Wallet> {
        this.walletQueryRef = this.apollo.watchQuery<{ myWallet: Wallet }>({
            query: MY_WALLET_QUERY,
            fetchPolicy: 'network-only',
            nextFetchPolicy: 'network-only',
            pollInterval: 10000,
        });

        return this.walletQueryRef.valueChanges.pipe(
            map(res => res.data?.myWallet),
            filter((wallet): wallet is Wallet => wallet !== undefined),
        );
    }

    refetchWallet() {
        return this.walletQueryRef?.refetch();
    }
}
