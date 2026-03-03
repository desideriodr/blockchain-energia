/*
 * IEnergyContractBlockchain — Puerto de infraestructura blockchain
 *
 * Patrón: Puerto (Hexagonal Architecture)
 *
 * conecta la logica del negocio con blockchain
 * pero manteniendo independencia
 * 
 * el servicio de blockchain actual puede cambiarse sin afectar la logica de negocio
 */
export interface IEnergyContractBlockchain {
    /*
     * Despliega contrato.
     * Retorna la dirección del contrato desplegado.
     */
    deployEnergyContract(
        buyer: string,
        seller: string,
        pricePerKwhCop: string,
        startTimestamp: number,
        endTimestamp: number,
    ): Promise<string>;

    /*
     * Activa el contrato previamente desplegado.
     * Retorna el hash de la transacción.
     */
    activateContract(contractAddress: string): Promise<string>;

    /*
     * Reporta consumos de energía.
     * Retorna el hash de la transacción.
     */
    reportConsumption(contractAddress: string, kwh: string): Promise<string>;

    /*
     * Suspende un contrato activo (sin producción, fondos insuficientes, etc).
     * Requiere motivo. Retorna el hash de la transacción.
     */
    suspendContract(contractAddress: string, reason: string): Promise<string>;

    /*
     * Reactiva un contrato suspendido.
     * Retorna el hash de la transacción.
     */
    resumeContract(contractAddress: string): Promise<string>;

    /*
     * Cancela un contrato activo.
     * Retorna el hash de la transacción.
     */
    cancelContract(contractAddress: string, reason: string): Promise<string>;

    /*
     * Marca un contrato como completado.
     * Retorna el hash de la transacción.
     */
    completeContract(contractAddress: string): Promise<string>;

    /*
     * Termina un contrato por vencimiento de términos.
     * Retorna el hash de la transacción.
     */
    terminateByExpiration(contractAddress: string): Promise<string>;

    /*
     * Emite RECs al productor cuando genera energía renovable.
     * Retorna el hash de la transacción.
     */
    mintREC(producerAddress: string, sourceType: string, kwh: string): Promise<string>;

    /*
     * Quema RECs del consumidor cuando consume energía certificada.
     * Retorna el hash de la transacción.
     */
    burnREC(consumerAddress: string, contractAddress: string, kwh: string): Promise<string>;

    /*
     * Lee el estado actual de un contrato desde la blockchain.
     */
    getContractState(contractAddress: string): Promise<{
        buyer: string;
        seller: string;
        pricePerKwhCop: string;
        consumedKwh: string;
        startTimestamp: string;
        endTimestamp: string;
        state: string | number;
        totalAmountCop: string;
    }>;
}

/*
 * Token de inyección de dependencias para el puerto.
 */
export const ENERGY_CONTRACT_BLOCKCHAIN_PORT = 'ENERGY_CONTRACT_BLOCKCHAIN_PORT';
