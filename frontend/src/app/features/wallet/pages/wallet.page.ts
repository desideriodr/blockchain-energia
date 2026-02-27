import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of, firstValueFrom } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';

import { WalletService } from '../../../core/graphql/services/wallet.service';
import { WalletTransactionService } from '../../../core/graphql/services/wallet-transactions.service';
import { WalletTransaction } from '../../../core/graphql/models/transaction.model';
import { WalletTransactionPage } from '../../../core/graphql/models/transaction-page.model';
import { Wallet } from '../../../core/graphql/models/wallet.model';

interface WalletTransactionView extends WalletTransaction {
  signedAmount: number;
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.page.html',
  styleUrls: ['./wallet.page.scss'],
})
export class WalletPage implements OnInit, OnDestroy {

  walletData: Wallet | null = null;
  transactions: WalletTransactionView[] = [];

  page = 1;
  pageSize = 10;
  totalItems = 0;

  depositAmount = 0;
  withdrawAmount = 0;

  filterType = '';
  fromDate: string | null = null;
  toDate: string | null = null;

  loading = false;

  private destroy$ = new Subject<void>();
  private loadPage$ = new Subject<void>();

  constructor(
    private walletService: WalletService,
    private txService: WalletTransactionService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // ── Wallet ──────────────────────────────────────────────
    this.walletService.getMyWallet().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: data => { this.walletData = data; this.cdr.markForCheck(); },
      error: err => console.error('Error cargando wallet', err)
    });

    // ── Transacciones ────────────────────────────────────────
    this.loadPage$.pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        this.loading = true;
        this.cdr.markForCheck();

        return this.txService.getMyTransactions({
          limit: this.pageSize,
          offset: (this.page - 1) * this.pageSize,
          type: this.filterType || undefined,
          from: this.fromDate || undefined,
          to: this.toDate || undefined,
        }).pipe(
          catchError(err => {
            console.error('Error cargando transacciones', err);
            return of({ total: 0, data: [], limit: this.pageSize, offset: 0 } as WalletTransactionPage);
          })
        );
      })
    ).subscribe(response => {
      this.totalItems = response.total;
      this.transactions = (response.data ?? []).map(tx => ({
        ...tx,
        signedAmount: this.getSignedAmount(tx)
      }));
      this.loading = false;
      this.cdr.markForCheck();
    });

    this.loadPage$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadPage$.next();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadPage$.next();
    }
  }

  applyFilters(): void {
    this.page = 1;
    this.loadPage$.next();
  }

  async depositCop(): Promise<void> {
    if (this.depositAmount <= 0) return;
    await firstValueFrom(this.txService.depositCop(this.depositAmount));
    this.depositAmount = 0;
    this.loadPage$.next();
  }

  async withdrawCop(): Promise<void> {
    if (this.withdrawAmount <= 0) return;
    await firstValueFrom(this.txService.withdrawCop(this.withdrawAmount));
    this.withdrawAmount = 0;
    this.loadPage$.next();
  }

  trackById(_: number, item: WalletTransactionView): string {
    return item.id;
  }

  private getSignedAmount(tx: WalletTransaction): number {
    const myAddress = this.walletData?.address;

    switch (tx.type) {

      case 'energy_consumption':
        // fromAddress paga → negativo para el comprador
        // toAddress recibe → positivo para el vendedor
        if (!myAddress) return -tx.amountCop;
        return tx.fromAddress === myAddress
          ? -Math.abs(tx.amountCop)   // soy el que paga
          : Math.abs(tx.amountCop);  // soy el que cobra

      case 'cop_deposit':
        return Math.abs(tx.amountCop);

      case 'cop_withdraw':
        return -Math.abs(tx.amountCop);

      default:
        // Si soy fromAddress, salió dinero
        if (!myAddress) return tx.amountCop;
        return tx.fromAddress === myAddress
          ? -Math.abs(tx.amountCop)
          : Math.abs(tx.amountCop);
    }
  }

  getDisplayAmount(tx: WalletTransactionView): number {
    return (tx.type === 'cop_deposit' || tx.type === 'cop_withdraw')
      ? tx.grossAmountCop
      : tx.amountCop + tx.feeCOP;
  }
}