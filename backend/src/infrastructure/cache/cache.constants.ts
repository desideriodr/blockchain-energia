/* CACHE_TTL — Tiempos de vida del caché por tipo de dato
 * implementamos dependecia cache-manager v5+:
 * se guarda en cache los datos consultados en dashboard
 * evitamos saturacion de la db, criterio:
 * Datos que cambian con cada transacción/consumo → TTL corto  (5 min)
 * Datos históricos del mes o distribución estable → TTL medio (15 min)
 * QUERY ((MIN * 60) = SEG * 1000)MILISEGUNDOS
 */
export const CACHE_TTL = {

  DASHBOARD_KPI:       5  * 60 * 1000,   // 5 min  — balance, conteos
  HOURLY_ENERGY:       5  * 60 * 1000,   // 5 min  — datos del día en curso
  HOURLY_FINANCIAL:    5  * 60 * 1000,   // 5 min  — finanzas del día en curso
  MONTHLY_ENERGY:      15 * 60 * 1000,   // 15 min — acumulados por día del mes
  SOURCE_DISTRIBUTION: 15 * 60 * 1000,   // 15 min — cambia solo al agregar fuentes
  CONTRACTS_COUNT:     5  * 60 * 1000,   // 5 min  — cambia al contratar
} as const;

/* cacheKey — Generadores de claves con namespace por usuario
 * Patrón: "dominio:subdominio:userId"
 * Garantiza aislamiento de datos entre usuarios.
 */
export const cacheKey = {
  dashboardKpi:       (userId: string) => `dashboard:kpi:${userId}`,
  hourlyEnergy:       (userId: string) => `dashboard:hourly-energy:${userId}`,
  hourlyFinancial:    (userId: string) => `dashboard:hourly-financial:${userId}`,
  monthlyEnergy:      (userId: string) => `dashboard:monthly-energy:${userId}`,
  sourceDistribution: (userId: string) => `dashboard:source-dist:${userId}`,
  contractsCount:     (userId: string) => `dashboard:contracts-count:${userId}`,
} as const;
