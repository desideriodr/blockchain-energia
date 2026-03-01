/**
 * Nombres de colas BullMQ para el módulo de simulación.
 * Centralizado para evitar strings duplicados y typos.
 */
export const SIMULATION_QUEUE = {
  PRODUCTION: 'simulation-production',
  CONSUMPTION: 'simulation-consumption',
} as const;

/**
 * Nombres de jobs dentro de cada cola.
 */
export const SIMULATION_JOB = {
  SIMULATE_SOURCE:   'simulate-source',   // producción por fuente
  SIMULATE_CONTRACT: 'simulate-contract', // consumo por contrato
} as const;

/**
 * Tipos de los payloads de cada job.
 */
export interface SimulateSourceJobData {
  sourceId: string;
  userId: string;
  sourceType: string;
  capacityKw: number;
}

export interface SimulateContractJobData {
  contractId: string;
  endDate: string; // ISO string — Date no es serializable en JSON
}
