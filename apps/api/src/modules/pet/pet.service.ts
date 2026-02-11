import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { GuardianRole } from '@pettopia/database';

@Injectable()
export class PetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(guardianId: string, dto: CreatePetDto) {
    // 이미 펫에 연결된 집사인지 확인
    const existing = await this.prisma.petGuardian.findUnique({
      where: { guardianId },
    });
    if (existing) {
      throw new ConflictException('이미 펫이 등록되어 있습니다. 집사당 펫은 1개만 가능합니다.');
    }

    // PetAccount 생성 + PetGuardian(OWNER, ACCEPTED) 동시 생성
    const pet = await this.prisma.$transaction(async (tx) => {
      const petAccount = await tx.petAccount.create({
        data: {
          guardianId,
          name: dto.name,
          species: dto.species,
          profileImage: dto.profileImage,
          breed: dto.breed,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          gender: dto.gender,
          bio: dto.bio,
          personality: dto.personality || [],
          favorites: dto.favorites || [],
        },
      });

      await tx.petGuardian.create({
        data: {
          petAccountId: petAccount.id,
          guardianId,
          role: 'OWNER',
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return petAccount;
    });

    return pet;
  }

  async findMine(guardianId: string) {
    const petGuardian = await this.prisma.petGuardian.findFirst({
      where: { guardianId, status: 'ACCEPTED' },
      include: { petAccount: true },
    });

    return petGuardian?.petAccount || null;
  }

  async findOne(id: string) {
    const pet = await this.prisma.petAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
            sentRequests: { where: { status: 'ACCEPTED' } },
            receivedRequests: { where: { status: 'ACCEPTED' } },
          },
        },
        petGuardians: {
          where: { status: 'ACCEPTED' },
          include: {
            guardian: {
              select: { id: true, name: true, email: true, profileImage: true },
            },
          },
        },
      },
    });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    return pet;
  }

  async update(id: string, guardianId: string, dto: UpdatePetDto) {
    const petGuardian = await this.prisma.petGuardian.findFirst({
      where: { petAccountId: id, guardianId, status: 'ACCEPTED' },
    });
    if (!petGuardian) {
      throw new NotFoundException('Pet not found');
    }
    if (petGuardian.role !== 'OWNER' && petGuardian.role !== 'ADMIN') {
      throw new ForbiddenException('권한이 없습니다. OWNER 또는 ADMIN만 수정 가능합니다.');
    }

    return this.prisma.petAccount.update({
      where: { id },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async remove(id: string, guardianId: string) {
    const petGuardian = await this.prisma.petGuardian.findFirst({
      where: { petAccountId: id, guardianId, status: 'ACCEPTED' },
    });
    if (!petGuardian) {
      throw new NotFoundException('Pet not found');
    }
    if (petGuardian.role !== 'OWNER') {
      throw new ForbiddenException('OWNER만 펫을 삭제할 수 있습니다.');
    }

    await this.prisma.petAccount.delete({ where: { id } });
    return { message: 'Pet deleted' };
  }

  // ===== Guardian Management =====

  async inviteGuardian(petAccountId: string, email: string, invitingGuardianId: string) {
    // 초대 권한 확인 (OWNER 또는 ADMIN)
    const inviter = await this.prisma.petGuardian.findFirst({
      where: { petAccountId, guardianId: invitingGuardianId, status: 'ACCEPTED' },
    });
    if (!inviter) {
      throw new NotFoundException('Pet not found');
    }
    if (inviter.role !== 'OWNER' && inviter.role !== 'ADMIN') {
      throw new ForbiddenException('OWNER 또는 ADMIN만 집사를 초대할 수 있습니다.');
    }

    // 초대 대상 집사 찾기
    const targetGuardian = await this.prisma.guardian.findUnique({
      where: { email },
    });
    if (!targetGuardian) {
      throw new NotFoundException('해당 이메일의 사용자를 찾을 수 없습니다.');
    }

    // 이미 연결된 펫이 있는지 확인
    const existingLink = await this.prisma.petGuardian.findUnique({
      where: { guardianId: targetGuardian.id },
    });
    if (existingLink) {
      if (existingLink.petAccountId === petAccountId) {
        throw new ConflictException('이미 이 펫에 초대되었거나 연결되어 있습니다.');
      }
      throw new ConflictException('이미 다른 펫에 연결되어 있는 사용자입니다.');
    }

    const petGuardian = await this.prisma.petGuardian.create({
      data: {
        petAccountId,
        guardianId: targetGuardian.id,
        role: 'MEMBER',
        status: 'PENDING',
        invitedBy: invitingGuardianId,
      },
      include: {
        guardian: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
      },
    });

    return petGuardian;
  }

  async getInvitations(guardianId: string) {
    return this.prisma.petGuardian.findMany({
      where: { guardianId, status: 'PENDING' },
      include: {
        petAccount: true,
        inviter: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvitation(petGuardianId: string, guardianId: string) {
    const invitation = await this.prisma.petGuardian.findUnique({
      where: { id: petGuardianId },
    });
    if (!invitation || invitation.guardianId !== guardianId) {
      throw new NotFoundException('초대를 찾을 수 없습니다.');
    }
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('이미 처리된 초대입니다.');
    }

    return this.prisma.petGuardian.update({
      where: { id: petGuardianId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
      include: { petAccount: true },
    });
  }

  async rejectInvitation(petGuardianId: string, guardianId: string) {
    const invitation = await this.prisma.petGuardian.findUnique({
      where: { id: petGuardianId },
    });
    if (!invitation || invitation.guardianId !== guardianId) {
      throw new NotFoundException('초대를 찾을 수 없습니다.');
    }
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('이미 처리된 초대입니다.');
    }

    // 거절 시 레코드 삭제 (다시 초대 가능하도록)
    await this.prisma.petGuardian.delete({ where: { id: petGuardianId } });
    return { message: '초대를 거절했습니다.' };
  }

  async getGuardians(petAccountId: string) {
    return this.prisma.petGuardian.findMany({
      where: { petAccountId, status: 'ACCEPTED' },
      include: {
        guardian: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateGuardianRole(
    petAccountId: string,
    targetGuardianId: string,
    newRole: GuardianRole,
    requestingGuardianId: string,
  ) {
    // OWNER 권한 확인
    const requester = await this.prisma.petGuardian.findFirst({
      where: { petAccountId, guardianId: requestingGuardianId, status: 'ACCEPTED' },
    });
    if (!requester || requester.role !== 'OWNER') {
      throw new ForbiddenException('OWNER만 역할을 변경할 수 있습니다.');
    }

    // 자기 자신의 역할은 변경 불가
    if (targetGuardianId === requestingGuardianId) {
      throw new BadRequestException('자신의 역할은 변경할 수 없습니다.');
    }

    // OWNER 역할 부여 불가
    if (newRole === 'OWNER') {
      throw new BadRequestException('OWNER 역할은 양도할 수 없습니다.');
    }

    const target = await this.prisma.petGuardian.findFirst({
      where: { petAccountId, guardianId: targetGuardianId, status: 'ACCEPTED' },
    });
    if (!target) {
      throw new NotFoundException('해당 집사를 찾을 수 없습니다.');
    }

    return this.prisma.petGuardian.update({
      where: { id: target.id },
      data: { role: newRole },
      include: {
        guardian: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
      },
    });
  }

  async removeGuardian(
    petAccountId: string,
    targetGuardianId: string,
    requestingGuardianId: string,
  ) {
    // OWNER 권한 확인
    const requester = await this.prisma.petGuardian.findFirst({
      where: { petAccountId, guardianId: requestingGuardianId, status: 'ACCEPTED' },
    });
    if (!requester || requester.role !== 'OWNER') {
      throw new ForbiddenException('OWNER만 집사를 제거할 수 있습니다.');
    }

    // 자기 자신은 제거 불가
    if (targetGuardianId === requestingGuardianId) {
      throw new BadRequestException('자기 자신을 제거할 수 없습니다.');
    }

    const target = await this.prisma.petGuardian.findFirst({
      where: { petAccountId, guardianId: targetGuardianId },
    });
    if (!target) {
      throw new NotFoundException('해당 집사를 찾을 수 없습니다.');
    }

    await this.prisma.petGuardian.delete({ where: { id: target.id } });
    return { message: '집사를 제거했습니다.' };
  }
}
