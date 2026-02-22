import { gql } from 'apollo-angular';

export const SIGNUP_MUTATION = gql`
  mutation Signup($nombres: String!, $apellidos: String!, $email: String!, $password: String!) {
    signup(nombres: $nombres, apellidos: $apellidos, email: $email, password: $password) {
      access_token
      user {
        id
        email
        nombres
        apellidos
      }
    }
  }
`;
