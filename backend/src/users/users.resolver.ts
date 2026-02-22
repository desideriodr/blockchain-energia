import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'auth/gql-auth.guard';
import { CurrentUser } from 'auth/current-user.decorator';
import { User } from './user.entity';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => Boolean)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('nombres') nombres: string,
    @Args('apellidos') apellidos: string,
  ) {
    await this.usersService.create(email, password, nombres, apellidos);
    return true;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  me(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }
}
