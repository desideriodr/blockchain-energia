import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(email: string, password: string, nombres: string, apellidos: string) {
      const user = this.repo.create({
        email,
        password,
        nombres,
        apellidos,
        activo: true
      });
      return this.repo.save(user);
    }


  async findByEmail(email: string): Promise<User | null> {
    return await this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.repo.findOne({ where: { id } });
  }
}
