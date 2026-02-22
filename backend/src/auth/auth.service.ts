import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginResponse } from './dto/login-response.dto';
import { User } from '../users/user.entity';
import { WalletService } from 'finance/wallet/wallet.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly walletService: WalletService,
  ) {}

  // =========================
  // VALIDATE USER (LOGIN)
  // =========================
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passOk = await bcrypt.compare(password, user.password);
    if (!passOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  // =========================
  // LOGIN
  // =========================
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = await this.jwt.signAsync(payload);

    return {
      access_token,
      user,
    };
  }

  // =========================
  // SIGNUP
  // =========================
  async signup(
    nombres: string,
    apellidos: string,
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    const exists = await this.usersService.findByEmail(email);
    if (exists) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create(
      email,
      hashedPassword,
      nombres,
      apellidos,
    );

    await this.walletService.getWalletByUser(user.id);
    
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = await this.jwt.signAsync(payload);

    return {
      access_token,
      user,
    };
  }
}
