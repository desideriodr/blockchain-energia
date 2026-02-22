import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { EnergySourceService } from '../../../core/graphql/services/energy-source.service';
import { EnergySource } from '../../../core/graphql/models/energy-source.model';

@Component({
  selector: 'app-energy-source',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './energy-source.page.html',
  styleUrls: ['./energy-source.page.scss'],
})
export class EnergySourcePage implements OnInit {

  // LISTADO
  sources$!: Observable<EnergySource[]>;

  // FORM
  newSourceType!: 'SOLAR' | 'EOLICA' | 'HIDRO' | 'BIOMASA' | 'OTRO';
  sourceTypes: Array<'SOLAR' | 'EOLICA' | 'HIDRO' | 'BIOMASA' | 'OTRO'> = [
  'SOLAR',
  'EOLICA',
  'HIDRO',
  'BIOMASA',
  'OTRO',
];
  newCapacity = 0;

  constructor(private service: EnergySourceService) {}

  ngOnInit() {
    this.loadSources();
  }

  loadSources() {
    this.sources$ = this.service.getMySources();
  }

  // CREATE
  createSource() {
    if (!this.newSourceType || this.newCapacity <= 0) return;

    this.service.create({
      sourceType: this.newSourceType,
      capacityKw: this.newCapacity,
    }).subscribe(() => {
      this.newCapacity = 0;
      this.newSourceType = undefined as any;
      this.loadSources();
    });
  }

  // TOGGLE
  toggle(id: string) {
    this.service.toggle(id).subscribe(() => {
      this.loadSources();
    });
  }

  // DELETE
  delete(id: string) {
    this.service.delete(id).subscribe(() => {
      this.loadSources();
    });
  }
}
