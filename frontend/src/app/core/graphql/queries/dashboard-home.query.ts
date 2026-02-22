import { gql } from 'apollo-angular';

export const DASHBOARD_HOME_QUERY = gql`
  query DashboardHome {
    dashboardHome {
      kpis {
        totalEnergyProduced
        totalTransactions
        totalEnergyTransferred
      }
      energySeries {
        date
        value
      }
      transactionSeries {
        date
        value
      }
    }
  }
`;
