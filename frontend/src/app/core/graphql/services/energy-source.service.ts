import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map, filter } from 'rxjs';
import { EnergySource } from '../models/energy-source.model';
import { MY_ENERGY_SOURCES } from '../queries/my-energy-sources.query';
import { CREATE_ENERGY_SOURCE } from '../mutations/create-energy-source.mutation';
import { UPDATE_ENERGY_SOURCE } from '../mutations/update-energy-source.mutation';
import { TOGGLE_ENERGY_SOURCE } from '../mutations/toggle-energy-source.mutation';
import { DELETE_ENERGY_SOURCE } from '../mutations/delete-energy-source.mutation';
import { CreateEnergySourceInput } from '../inputs/create-energy-source.input';
import { UpdateEnergySourceInput } from '../inputs/update-energy-source.input';


@Injectable({ providedIn: 'root' })
export class EnergySourceService {
  constructor(private apollo: Apollo) {}

  getMySources(): Observable<EnergySource[]> {
    return this.apollo
      .watchQuery<{ myEnergySources: EnergySource[] }>({
        query: MY_ENERGY_SOURCES,
      })
      .valueChanges.pipe(
        map(res => res.data?.myEnergySources ?? []),
        map(sources => sources.filter((src): src is EnergySource => src !== undefined))
      );
  }

  create(input: CreateEnergySourceInput) {
    return this.apollo.mutate({
      mutation: CREATE_ENERGY_SOURCE,
      variables: { input },
      refetchQueries: [{ query: MY_ENERGY_SOURCES }],
    });
  }

  update(input: UpdateEnergySourceInput) {
    return this.apollo.mutate({
      mutation: UPDATE_ENERGY_SOURCE,
      variables: { input },
      refetchQueries: [{ query: MY_ENERGY_SOURCES }],
    });
  }

  toggle(sourceId: string) {
    return this.apollo.mutate({
      mutation: TOGGLE_ENERGY_SOURCE,
      variables: { sourceId },
      refetchQueries: [{ query: MY_ENERGY_SOURCES }],
    });
  }

  delete(id: string) {
    return this.apollo.mutate({
      mutation: DELETE_ENERGY_SOURCE,
      variables: { id },
      refetchQueries: [{ query: MY_ENERGY_SOURCES }],
    });
  }
}
