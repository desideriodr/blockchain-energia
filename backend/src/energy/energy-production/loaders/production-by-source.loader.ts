import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { EnergyProduction } from '../energy-production.entity';

/* createProductionBySourceLoader — DataLoader para producción agrupada por fuente
 *
 * resolvemos una query unica con sourseId agrupados 
 * evitando que graph haga n consultas por query
 */
export type ProductionMetrics = {
  producedTotal: number;
  producedToday: number;
};

export function createProductionBySourceLoader(
  repo: Repository<EnergyProduction>,
) {
  return new DataLoader<string, ProductionMetrics>(
    async (sourceIds: readonly string[]) => {
      const ids = [...sourceIds];

      // Query 1: totales históricos por fuente
      const totals = await repo
        .createQueryBuilder('p')
        .select('p.energySourceId', 'sourceId')
        .addSelect('COALESCE(SUM(p.amount), 0)', 'sum')
        .where('p.energySourceId IN (:...ids)', { ids })
        .groupBy('p.energySourceId')
        .getRawMany();

      // Query 2: producción del día actual por fuente
      const todays = await repo
        .createQueryBuilder('p')
        .select('p.energySourceId', 'sourceId')
        .addSelect('COALESCE(SUM(p.amount), 0)', 'sum')
        .where('p.energySourceId IN (:...ids)', { ids })
        .andWhere('p.createdAt >= CURRENT_DATE')
        .groupBy('p.energySourceId')
        .getRawMany();

      const totalMap = new Map(totals.map(r => [r.sourceId, Number(r.sum)]));
      const todayMap = new Map(todays.map(r => [r.sourceId, Number(r.sum)]));

      // Retornar en el mismo orden que sourceIds (requisito de DataLoader)
      return sourceIds.map(id => ({
        producedTotal: totalMap.get(id) ?? 0,
        producedToday: todayMap.get(id) ?? 0,
      }));
    },
  );
}
