import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, switchMap } from 'rxjs';

import { OffersBoardService } from '../../../core/graphql/services/offers-board.service';
import { EnergyOffer } from '../../../core/graphql/models/energy-offer.model';
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
  offers$!: Observable<EnergyOffer[]>;
  page = 1;
  perPage = 10;

  pricePerKwhCop: number = 0;
  loading: boolean = false;

  private refresh$ = new BehaviorSubject<void>(undefined);

  constructor(private service: OffersBoardService) {}

  ngOnInit() {
    // Lista de ofertas con refresh
    this.offers$ = this.refresh$.pipe(
      switchMap(() => this.service.getOpenOffers())
    );
  }

  createOffer() {

    this.loading = true;
    const input: CreateEnergyOfferInput = {
      pricePerKwhCop: this.pricePerKwhCop,
    };

    this.service.createOffer(input).subscribe({
      next: () => {
        alert('Oferta creada exitosamente');
        this.pricePerKwhCop = 0;
        this.refresh$.next(); // refrescar lista
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
        alert('Oferta contratada correctamente');
        this.refresh$.next(); // refrescar lista
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
    this.refresh$.next();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.refresh$.next();
    }
  }
}
