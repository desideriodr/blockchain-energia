import { Routes } from '@angular/router';
import { authGuard } from '././core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('././auth/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('././auth/signup/signup.page').then(m => m.SignupPage),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/main/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('././features/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'offers-board',
        loadComponent: () =>
          import('./features/offers-board/pages/offers-board.page').then(m => m.OffersBoardPage),
      },
      {
        path: 'production',
        loadComponent: () =>
          import('./features/production/pages/production.page').then(m => m.ProductionPage),
      },
      {
        path: 'energy-sources',
        loadComponent: () =>
          import('./features/production/pages/energy-source.page').then(m => m.EnergySourcePage),
      },
      {
        path: 'wallet',
        loadComponent: () =>
          import('./features/wallet/pages/wallet.page').then(m => m.WalletPage),
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('./features/contracts/pages/contracts.page').then(m => m.ContractsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' }
];
