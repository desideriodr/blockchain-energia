import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { PRODUCTION_DASHBOARD_QUERY } from '../queries/dashboard-production.query';
import { ProductionDashboard } from '../models/dashboard-production.model';

@Injectable({ providedIn: 'root' })
export class ProductionService {
  constructor(private apollo: Apollo) { }

  getDashboard(): Observable<ProductionDashboard> {
    return this.apollo
      .watchQuery<{ productionDashboard?: ProductionDashboard }>({
        query: PRODUCTION_DASHBOARD_QUERY,
      })
      .valueChanges.pipe(
        map(r => r.data?.productionDashboard),
        filter((d): d is ProductionDashboard => d !== undefined
        )
      );
  }
}
