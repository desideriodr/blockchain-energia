import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { EnergyConsumption } from '../energy-consumption.entity';

/* createConsumptionsLoader — DataLoader para consumos por contrato
 *
 * el loader evita que GraphQL resuelva una lista de N contratos y cada uno
 * pida su campo `consumptions`, se ejecuten N queries individuales.
 * agrupando las N peticiones en una sola query.
 */
export function createConsumptionsLoader(
  repo: Repository<EnergyConsumption>,
) {
  return new DataLoader<string, EnergyConsumption[]>(
    async (contractIds: readonly string[]) => {
      const consumptions = await repo.find({
        where: { contract: { id: In([...contractIds]) } },
        relations: ['contract'],
        order: { recordedAt: 'DESC' },
      });

      // Agrupar consumptions por contractId
      const map = new Map<string, EnergyConsumption[]>();
      contractIds.forEach(id => map.set(id, []));
      consumptions.forEach(c => {
        const list = map.get(c.contract.id);
        if (list) list.push(c);
      });

      // Retornar en el mismo orden que los IDs de entrada (requisito de DataLoader)
      return contractIds.map(id => map.get(id) ?? []);
    },
  );
}
