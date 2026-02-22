import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnergySource } from './energy-source.entity';
import { EnergyProduction } from 'energy/energy-production/energy-production.entity';
import { UsersModule } from 'users/users.module';

import { EnergySourceService } from './energy-source.service';
import { EnergySourceResolver } from './energy-source.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnergySource,
      //EnergyProduction, // se usará para validaciones futuras
      UsersModule
    ]),
  ],
  providers: [
    EnergySourceService,
    EnergySourceResolver,
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class EnergySourceModule {}
