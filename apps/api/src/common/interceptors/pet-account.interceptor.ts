import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PetAccountInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    if (!req.user) {
      return next.handle();
    }

    const guardianId = req.user.id;

    // 집사당 펫 1개이므로 헤더 없이도 자동 resolve
    const petGuardian = await this.prisma.petGuardian.findFirst({
      where: { guardianId, status: 'ACCEPTED' },
      include: { petAccount: true },
    });

    if (petGuardian) {
      req.petAccount = petGuardian.petAccount;
      req.petGuardianRole = petGuardian.role;
    }

    return next.handle();
  }
}
