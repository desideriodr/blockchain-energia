import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { GqlAuthGuard } from './gql-auth.guard';
import * as dotenv from 'dotenv';
import { WalletModule } from 'finance/wallet/wallet.module';
import { MeResolver } from './me.resolver';
import { BlockchainModule } from 'infrastructure/blockchain/blockchain.module';

dotenv.config();

@Module({
  imports: [
    BlockchainModule,
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any },
    }),
    WalletModule,
  ],
  providers: [AuthService, JwtStrategy, AuthResolver, GqlAuthGuard, MeResolver],
  exports: [AuthService],
})
export class AuthModule {}
