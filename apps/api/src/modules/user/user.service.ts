import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(guardianId: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profileImage: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }
    return guardian;
  }

  async updateProfile(guardianId: string, dto: UpdateProfileDto) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
    });
    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.profileImage !== undefined && { profileImage: dto.profileImage }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profileImage: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(guardianId: string, dto: ChangePasswordDto) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
    });
    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }
    if (!guardian.password) {
      throw new BadRequestException('Social login accounts cannot change password');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, guardian.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: { password: hashed },
    });

    return { message: 'Password changed successfully' };
  }

  async deleteAccount(guardianId: string) {
    // Check if guardian is OWNER of any pet
    const ownedPets = await this.prisma.petGuardian.findMany({
      where: {
        guardianId,
        role: 'OWNER',
      },
    });

    if (ownedPets.length > 0) {
      throw new BadRequestException(
        'Cannot delete account while owning pets. Transfer ownership first.',
      );
    }

    // Delete guardian (cascading will handle petGuardian entries)
    await this.prisma.guardian.delete({
      where: { id: guardianId },
    });

    return { message: 'Account deleted successfully' };
  }
}
