export enum EnergySourceType {
    SOLAR = 'SOLAR',
    EOLICA = 'EOLICA',
    HIDRO = 'HIDRO',
    BIOMASA = 'BIOMASA',
    OTRO = 'OTRO',
}

export interface EnergySource {
    id: string;
    sourceType: EnergySourceType;
    capacityKw: number;
    isActive: boolean;
    createdAt: string;
}