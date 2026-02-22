import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom } from 'rxjs';

import { WalletService } from '../../../core/graphql/services/wallet.service';
import { WalletTransactionService } from '../../../core/graphql/services/wallet-transactions.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.page.html',
  styleUrls: ['./wallet.page.scss'],
})
export class WalletPage implements OnInit {

  wallet$!: Observable<any>;
  transactions$!: Observable<any[]>;

  depositAmount = 0;
  withdrawAmount = 0;

  constructor(
    private walletService: WalletService,
    private txService: WalletTransactionService
  ) {}

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData() {
    this.wallet$ = this.walletService.getMyWallet();
    this.transactions$ = this.txService.getMyTransactions();
  }

  async depositCop() {
    if (this.depositAmount <= 0) return;

    try {
      await firstValueFrom(
        this.txService.depositCop(this.depositAmount)
      );
      this.depositAmount = 0;
      this.refreshData();
    } catch {
      alert('Error al recargar COP');
    }
  }

  async withdrawCop() {
    if (this.withdrawAmount <= 0) return;

    try {
      await firstValueFrom(
        this.txService.withdrawCop(this.withdrawAmount)
      );
      this.withdrawAmount = 0;
      this.refreshData();
    } catch {
      alert('Fondos insuficientes o error al retirar');
    }
  }
}
