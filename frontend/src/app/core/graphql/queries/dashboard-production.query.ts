import { gql } from 'apollo-angular';

export const PRODUCTION_DASHBOARD_QUERY = gql`
  query ProductionDashboard {
    productionDashboard {
      energyStored
      sources {
        sourceId
        sourceType
        capacityKw
        producedTotal
        producedToday
      }
    }
  }
`;