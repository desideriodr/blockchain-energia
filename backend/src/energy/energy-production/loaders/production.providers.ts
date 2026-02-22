import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyProduction } from 'energy/energy-production/energy-production.entity';
import { createProductionLoader } from './production.loader';

export const ProductionLoaderProvider = {
  provide: 'PRODUCTION_LOADER',
  useFactory: (repo: Repository<EnergyProduction>) => {
    return createProductionLoader(repo);
  },
  inject: [getRepositoryToken(EnergyProduction)],
};
