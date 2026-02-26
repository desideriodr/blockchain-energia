import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { DashboardEnergyFinancial } from '../models/dashboard-energy-financial.model';

@Injectable({ providedIn: 'root' })
export class DashboardEnergyFinancialService {

  constructor(private apollo: Apollo) {}

  getDashboard(): Observable<DashboardEnergyFinancial> {
    return this.apollo.query<{ dashboardEnergyFinancial: DashboardEnergyFinancial }>({
      query: gql`
        query {
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
      `
    }).pipe(
      map(result => result.data!.dashboardEnergyFinancial)
    );
  }
}