import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PetAccountMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const petAccountId = req.headers['x-pet-account-id'] as string;

    if (petAccountId && (req as any).user) {
      const guardianId = (req as any).user.id;
      const petAccount = await this.prisma.petAccount.findFirst({
        where: {
          id: petAccountId,
          guardianId,
        },
      });

      if (petAccount) {
        (req as any).petAccount = petAccount;
      }
    }

    next();
  }
}
