import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Validate invite code if provided
    if (dto.inviteCode) {
      try {
        this.jwtService.verify(dto.inviteCode, {
          secret: process.env.JWT_SECRET || 'pettopia-jwt-secret',
        });
      } catch {
        throw new BadRequestException('Invalid or expired invite code');
      }
    }

    // Check duplicate email
    const existing = await this.prisma.guardian.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password and create guardian
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const guardian = await this.prisma.guardian.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
      },
    });

    // Issue tokens
    const tokens = this.generateTokens(guardian.id, guardian.email);
    return {
      guardian: {
        id: guardian.id,
        email: guardian.email,
        name: guardian.name,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { email: dto.email },
    });
    if (!guardian || !guardian.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, guardian.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(guardian.id, guardian.email);
    return {
      guardian: {
        id: guardian.id,
        email: guardian.email,
        name: guardian.name,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET || 'pettopia-jwt-refresh-secret',
      });

      const accessToken = this.jwtService.sign(
        { sub: payload.sub, email: payload.email },
        {
          secret: process.env.JWT_SECRET || 'pettopia-jwt-secret',
          expiresIn: '1h',
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateInviteCode(guardianId: string) {
    const token = this.jwtService.sign(
      { sub: guardianId, type: 'invite' },
      {
        secret: process.env.JWT_SECRET || 'pettopia-jwt-secret',
        expiresIn: '72h',
      },
    );
    return { inviteCode: token };
  }

  private generateTokens(guardianId: string, email: string) {
    const accessToken = this.jwtService.sign(
      { sub: guardianId, email },
      {
        secret: process.env.JWT_SECRET || 'pettopia-jwt-secret',
        expiresIn: '1h',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: guardianId, email },
      {
        secret:
          process.env.JWT_REFRESH_SECRET || 'pettopia-jwt-refresh-secret',
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
