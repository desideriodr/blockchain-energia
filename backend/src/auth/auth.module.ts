import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { GqlAuthGuard } from './gql-auth.guard';

import { AuthService } from './auth.service';

import { AuthResolver } from './auth.resolver';
import { MeResolver } from './me.resolver';

import { UsersModule } from '../users/users.module';
import { WalletModule } from 'finance/wallet/wallet.module';
import { BlockchainModule } from 'infrastructure/blockchain/blockchain.module';

/*
 * AuthModule - Modulo de autenticación
 */
@Module({
  imports: [
    BlockchainModule,
    UsersModule,
    PassportModule,

    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;

        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET debe estar definido y tener al menos 32 caracteres');
        }
        return {
          secret,
          signOptions: {
            expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as any,
          },
        };
      },
    }),
    WalletModule,
  ],
  providers: [AuthService, JwtStrategy, AuthResolver, GqlAuthGuard, MeResolver],
  exports: [AuthService],
})
export class AuthModule { }
