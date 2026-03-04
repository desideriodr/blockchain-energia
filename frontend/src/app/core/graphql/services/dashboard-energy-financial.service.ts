import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { filter, map, Observable } from 'rxjs';
import { DashboardEnergyFinancial } from '../models/dashboard-energy-financial.model';

const DASHBOARD_ENERGY_FINANCIAL_QUERY = gql`
  query DashboardEnergyFinancial {
    dashboardEnergyFinancial {
      hourlyFinancial {
        hour
        incomeCOP
        expenseCOP
      }
      hourlyEnergy {
        hour
        productionKwh
        consumptionKwh
      }
      monthlyEnergy {
        day
        productionKwh
        consumptionKwh
      }
      sourceDistribution {
        sourceType
        productionKwh
        capacityKw
      }
      contractsCount {
        contractedOffers
        activeContracts
      }
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class DashboardEnergyFinancialService {

  constructor(private apollo: Apollo) {}

  getDashboard(): Observable<DashboardEnergyFinancial> {
    return this.apollo
      .watchQuery<{ dashboardEnergyFinancial: DashboardEnergyFinancial }>({
        query: DASHBOARD_ENERGY_FINANCIAL_QUERY,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
        pollInterval: 10000,
      })
      .valueChanges.pipe(
        filter(result => !!result.data?.dashboardEnergyFinancial),
        map(result => result.data!.dashboardEnergyFinancial as DashboardEnergyFinancial),
      );
  }
}
