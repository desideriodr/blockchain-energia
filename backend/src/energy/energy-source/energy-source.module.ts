import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnergySource } from './energy-source.entity';
import { UsersModule } from 'users/users.module';

import { EnergySourceService } from './energy-source.service';
import { EnergySourceResolver } from './energy-source.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([ EnergySource ]),
    UsersModule,
  ],
  providers: [
    EnergySourceService,
    EnergySourceResolver,
  ],
  exports: [
    EnergySourceService,
    TypeOrmModule,
  ],
})
export class EnergySourceModule {}
