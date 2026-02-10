import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async register(data: { email: string; password: string; nickname: string }) {
    // TODO: Implement user registration with hashed password and JWT token generation
    return { message: 'register placeholder', data };
  }

  async login(data: { email: string; password: string }) {
    // TODO: Implement login with credential validation and JWT token pair issuance
    return { message: 'login placeholder', data };
  }

  async refresh(refreshToken: string) {
    // TODO: Implement token refresh with refresh token validation
    return { message: 'refresh placeholder', refreshToken };
  }
}
