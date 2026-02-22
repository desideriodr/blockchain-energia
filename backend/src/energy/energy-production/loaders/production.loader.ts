import DataLoader from 'dataloader';
import { EnergyProduction } from '../energy-production.entity';
import { In } from 'typeorm';
import { Repository } from 'typeorm';

export function createProductionLoader(
  repo: Repository<EnergyProduction>,
) {
  return new DataLoader<string, EnergyProduction | null>(
    async (productionIds: readonly string[]) => {
      const productions = await repo.find({
        where: { id: In([...productionIds]) },
      });

      const map = new Map<string, EnergyProduction>();
      productions.forEach(p => map.set(p.id, p));

      return productionIds.map(id => map.get(id) ?? null);
    },
  );
}
