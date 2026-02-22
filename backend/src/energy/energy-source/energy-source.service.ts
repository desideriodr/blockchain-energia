import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EnergySource } from './energy-source.entity';
import { CreateEnergySourceInput } from './inputs/create-energy-source.input';
import { UpdateEnergySourceInput } from './inputs/update-energy-source.input';

@Injectable()
export class EnergySourceService {
  constructor(
    @InjectRepository(EnergySource)
    private readonly energySourceRepo: Repository<EnergySource>,
  ) { }

  async findByUser(userId: string): Promise<EnergySource[]> {
    return this.energySourceRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async create(
    userId: string,
    input: CreateEnergySourceInput,
  ): Promise<EnergySource> {
    const source = this.energySourceRepo.create({
      ...input,
      user: { id: userId },
    });

    return this.energySourceRepo.save(source);
  }

  async update(
    userId: string,
    input: UpdateEnergySourceInput,
  ): Promise<EnergySource> {
    const source = await this.energySourceRepo.findOne({
      where: { id: input.id },
      relations: ['user'],
    });

    if (!source) {
      throw new NotFoundException('Fuente de energía no encontrada');
    }

    if (source.user.id !== userId) {
      throw new ForbiddenException('No tienes permiso para actualizar esta fuente de energía');
    }

    Object.assign(source, input);

    return this.energySourceRepo.save(source);
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const source = await this.energySourceRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!source) {
      throw new NotFoundException('Fuente de energía no encontrada');
    }

    if (source.user.id !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta fuente de energía');
    }

    await this.energySourceRepo.remove(source);
    return true;
  }

  async toggle(
    userId: string,
    sourceId: string,
  ): Promise<EnergySource> {

    const source = await this.energySourceRepo.findOne({
      where: { id: sourceId },
      relations: ['user'],
    });

    if (!source) {
      throw new NotFoundException('Fuente de energía no encontrada');
    }

    if (source.user.id !== userId) {
      throw new ForbiddenException('No autorizada');
    }

    source.isActive = !source.isActive;

    return this.energySourceRepo.save(source);
  }

}
