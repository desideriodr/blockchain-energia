/**
 * IoT Gateway — Constantes y tipos
 *
 * Simula el protocolo de comunicación de medidores inteligentes
 * usando Redis Pub/Sub como broker de mensajes, con estructura
 * de topics compatible con MQTT.
 *
 * Topic format (MQTT-style):
 *   iot/meter/{deviceId}/reading  → lectura medidor de producción
 *   iot/meter/{deviceId}/demand   → lectura medidor de consumo
 */

export const IOT_CHANNEL = {
    METER_READING: (deviceId: string) => `iot/meter/${deviceId}/reading`,
    METER_DEMAND: (deviceId: string) => `iot/meter/${deviceId}/demand`,
    NETWORK_STATUS: 'iot/network/status',
} as const;

/** Lectura publicada por un medidor de producción */
export interface IoTMeterReading {
    deviceId: string;
    userId: string;
    sourceType: string;
    capacityKw: number;
    timestamp: string;
    protocol: 'MQTT_SIM';
}

/** Lectura publicada por un medidor de consumo */
export interface IoTMeterDemand {
    deviceId: string;
    contractId: string;
    endDate: string;
    timestamp: string;
    protocol: 'MQTT_SIM';
}

/** Estado general de la red publicado en cada ciclo */
export interface IoTNetworkStatus {
    activeMeters: number;
    activeContracts: number;
    timestamp: string;
    gatewayId: string;
}