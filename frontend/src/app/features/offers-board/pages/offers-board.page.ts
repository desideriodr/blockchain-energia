import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, switchMap, tap } from 'rxjs';

import { OffersBoardService } from '../../../core/graphql/services/offers-board.service';
import { EnergyOffer, ProductionSummaryBySource } from '../../../core/graphql/models/energy-offer.model';
import { CreateEnergyOfferInput } from '../../../core/graphql/inputs/create-energy-offer.input';
import { ContractEnergyInput } from '../../../core/graphql/inputs/contract-energy.input';

@Component({
  selector: 'app-offers-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offers-board.page.html',
  styleUrls: ['./offers-board.page.scss'],
})
export class OffersBoardPage implements OnInit {

  // ── Tabla 1: producciones del usuario agrupadas por fuente ──
  productions$!: Observable<ProductionSummaryBySource[]>;
  isProducer = false;

  // Fuente seleccionada para publicar oferta
  selectedSource: ProductionSummaryBySource | null = null;
  pricePerKwhCop: number = 0;

  // ── Tabla 2: ofertas abiertas del mercado ──
  offers$!: Observable<EnergyOffer[]>;
  page = 1;
  perPage = 10;

  loading = false;

  private refreshOffers$ = new BehaviorSubject<void>(undefined);
  private refreshProductions$ = new BehaviorSubject<void>(undefined);

  // Labels legibles para los tipos de fuente
  readonly sourceLabels: Record<string, string> = {
    SOLAR: '☀️ Solar',
    EOLICA: '💨 Eólica',
    HIDRO: '💧 Hidro',
    BIOMASA: '🌿 Biomasa',
    OTRO: '⚡ Otro',
  };

  constructor(private service: OffersBoardService) {}

  ngOnInit() {
    this.offers$ = this.refreshOffers$.pipe(
      switchMap(() => this.service.getOpenOffers()),
    );

    this.productions$ = this.refreshProductions$.pipe(
      switchMap(() => this.service.getMyProductionsBySource()),
      tap(productions => {
        // El usuario es productor si tiene al menos una fuente con kWh disponibles
        this.isProducer = productions.some(p => p.availableKwh > 0);
      }),
    );
  }

  selectSource(source: ProductionSummaryBySource) {
    this.selectedSource = source;
    this.pricePerKwhCop = 0;
  }

  clearSelection() {
    this.selectedSource = null;
    this.pricePerKwhCop = 0;
  }

  sourceLabel(type: string): string {
    return this.sourceLabels[type] ?? type;
  }

  createOffer() {
    if (!this.selectedSource || this.pricePerKwhCop <= 0) return;

    this.loading = true;
    const input: CreateEnergyOfferInput = {
      pricePerKwhCop: this.pricePerKwhCop,
      energySourceId: this.selectedSource.sourceId,
    };

    this.service.createOffer(input).subscribe({
      next: () => {
        this.clearSelection();
        this.refreshOffers$.next();
        this.refreshProductions$.next();
      },
      error: (err) => {
        console.error(err);
        alert('Error creando la oferta');
      },
      complete: () => (this.loading = false),
    });
  }

  contract(offer: EnergyOffer) {
    if (offer.status !== 'OPEN') return;

    this.loading = true;
    const input: ContractEnergyInput = { offerId: offer.id };

    this.service.contractOffer(input).subscribe({
      next: () => {
        this.refreshOffers$.next();
      },
      error: (err) => {
        console.error(err);
        alert('Error contratando la oferta');
      },
      complete: () => (this.loading = false),
    });
  }

  nextPage() {
    this.page++;
    this.refreshOffers$.next();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.refreshOffers$.next();
    }
  }
}
