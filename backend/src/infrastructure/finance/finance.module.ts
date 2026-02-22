import { Module } from '@nestjs/common';
import { FinanceHelperService } from './finance-helper.service';
import { BlockchainModule } from 'infrastructure/blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  providers: [FinanceHelperService],
  exports: [FinanceHelperService],
})
export class FinanceModule {}
