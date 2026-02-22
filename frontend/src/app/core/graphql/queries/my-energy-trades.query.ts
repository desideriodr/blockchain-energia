import { gql } from "apollo-angular";

export const MY_ENERGY_TRADES = gql`
    query MyEnergyTrades {
        myEnergyTrades {
            id
            energyKwh
            totalCostCop
            status
            createdAt
            offer {
              id
            }
        }
    }`;
