import { registerEnumType } from '@nestjs/graphql';

export enum EnergySourceType {
  SOLAR = 'SOLAR',
  EOLICA = 'EOLICA',
  HIDRO = 'HIDRO',
  BIOMASA = 'BIOMASA',
  OTRO = 'OTRO',
}

registerEnumType(EnergySourceType, {
  name: 'EnergySourceType',
  description: 'Tipos de fuente de energía',
});
