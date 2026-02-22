import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DASHBOARD_HOME_QUERY } from '../queries/dashboard-home.query';
import { DashboardHome } from '../models/dashboard-home.model';

@Injectable({ providedIn: 'root' })
export class DashboardHomeService {
  constructor(private apollo: Apollo) {}

  getDashboardHome(): Observable<DashboardHome> {
    return this.apollo
      .watchQuery<{ dashboardHome: DashboardHome }>({
        query: DASHBOARD_HOME_QUERY,
        fetchPolicy: 'cache-first',
      })
      .valueChanges.pipe(
        map(result => result.data?.dashboardHome as DashboardHome)
      );
  }
}
