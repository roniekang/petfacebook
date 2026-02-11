import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { FriendRequestDto } from './dto/friend-request.dto';
import { FriendMethod } from '@pettopia/database';

@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  async sendRequest(petAccountId: string, dto: FriendRequestDto) {
    if (petAccountId === dto.receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check receiver exists
    const receiver = await this.prisma.petAccount.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Pet not found');
    }

    // Check for existing friendship (both directions)
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: petAccountId, receiverId: dto.receiverId },
          { requesterId: dto.receiverId, receiverId: petAccountId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new ConflictException('Already friends');
      }
      if (existing.status === 'PENDING') {
        throw new ConflictException('Friend request already pending');
      }
    }

    return this.prisma.friendship.create({
      data: {
        requesterId: petAccountId,
        receiverId: dto.receiverId,
        method: dto.method || FriendMethod.SEARCH,
      },
      include: {
        receiver: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });
  }

  async acceptRequest(friendshipId: string, petAccountId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }
    if (friendship.receiverId !== petAccountId) {
      throw new ForbiddenException('Only the receiver can accept');
    }
    if (friendship.status !== 'PENDING') {
      throw new BadRequestException('Request is not pending');
    }

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        requester: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });
  }

  async rejectRequest(friendshipId: string, petAccountId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }
    if (friendship.receiverId !== petAccountId) {
      throw new ForbiddenException('Only the receiver can reject');
    }
    if (friendship.status !== 'PENDING') {
      throw new BadRequestException('Request is not pending');
    }

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'REJECTED' },
    });
  }

  async list(petAccountId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: petAccountId },
          { receiverId: petAccountId },
        ],
      },
      include: {
        requester: {
          select: { id: true, name: true, profileImage: true, species: true },
        },
        receiver: {
          select: { id: true, name: true, profileImage: true, species: true },
        },
      },
    });

    // Return the friend (not self) from each friendship
    return friendships.map((f) => ({
      friendshipId: f.id,
      friend:
        f.requesterId === petAccountId ? f.receiver : f.requester,
      method: f.method,
      acceptedAt: f.acceptedAt,
    }));
  }

  async pendingRequests(petAccountId: string) {
    return this.prisma.friendship.findMany({
      where: {
        receiverId: petAccountId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: { id: true, name: true, profileImage: true, species: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async nearby(
    petAccountId: string,
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ) {
    // Haversine formula via raw SQL for distance calculation
    const pets = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        profileImage: string | null;
        species: string;
        latitude: number;
        longitude: number;
        distance: number;
      }>
    >`
      SELECT
        id, name, "profileImage", species,
        latitude::float, longitude::float,
        (6371 * acos(
          cos(radians(${lat})) * cos(radians(latitude::float))
          * cos(radians(longitude::float) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(latitude::float))
        )) AS distance
      FROM pet_accounts
      WHERE id != ${petAccountId}
        AND status = 'ACTIVE'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (6371 * acos(
          cos(radians(${lat})) * cos(radians(latitude::float))
          * cos(radians(longitude::float) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(latitude::float))
        )) < ${radiusKm}
      ORDER BY distance
      LIMIT 50
    `;

    return pets;
  }

  async getQrData(petAccountId: string) {
    const pet = await this.prisma.petAccount.findUnique({
      where: { id: petAccountId },
      select: { id: true, name: true, profileImage: true },
    });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    return { petId: pet.id, petName: pet.name, profileImage: pet.profileImage };
  }
}
