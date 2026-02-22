import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { LOGIN_MUTATION } from '../graphql/mutations/login.mutation';
import { SIGNUP_MUTATION } from '../graphql/mutations/signup.mutation';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private TOKEN_KEY = 'access_token';

  constructor(private apollo: Apollo) {}

  saveToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.apollo.mutate<any>({
      mutation: LOGIN_MUTATION,
      variables: { email, password }
    });
  }

  signup(nombres: string, apellidos: string, email: string, password: string) {
    return this.apollo.mutate<any>({
      mutation: SIGNUP_MUTATION,
      variables: { nombres, apellidos, email, password }
    });
  }
}
