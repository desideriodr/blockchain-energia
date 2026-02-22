import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ME_SUMMARY_QUERY } from '../graphql/queries/me-summary.query';
import { MeSummary } from '../graphql/models/me-summary.model';

@Injectable({ providedIn: 'root' })
export class UserContextService {

  private meSubject = new BehaviorSubject<MeSummary | null>(null);
  me$ = this.meSubject.asObservable();

  constructor(private apollo: Apollo) {}

  loadMeSummary() {
    return this.apollo
      .query<{ meSummary: MeSummary }>({
        query: ME_SUMMARY_QUERY,
        fetchPolicy: 'network-only', // luego se puede optimizar
      })
      .pipe(
        map(res => {
          if (res.data) {
            this.meSubject.next(res.data.meSummary);
            return res.data.meSummary;
          }
          return null;
        })
      );
  }

  getMeSummary(): Observable<MeSummary | null> {
    return this.meSubject.asObservable();
  }

  get snapshot(): MeSummary | null {
    return this.meSubject.value;
  }

  clear() {
    this.meSubject.next(null);
  }
}
