import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginResponse } from './dto/login-response.dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => LoginResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<LoginResponse> {
    return this.auth.login(email, password);
  }

  @Mutation(() => LoginResponse)
  async signup(
    @Args('nombres') nombres: string,
    @Args('apellidos') apellidos: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<LoginResponse> {
    return this.auth.signup(nombres, apellidos, email, password);
  }
}
