import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PostService } from '../post/post.service';
import { StartWalkDto, AddPhotoDto, UpdateLocationDto, EndWalkDto } from './dto/walk.dto';

@Injectable()
export class WalkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postService: PostService,
  ) {}

  async startWalk(petAccountId: string, dto: StartWalkDto) {
    const existing = await this.prisma.walkSession.findFirst({
      where: { petAccountId, status: 'WALKING' },
    });
    if (existing) {
      throw new ConflictException('Already has an active walk session');
    }

    return this.prisma.walkSession.create({
      data: {
        petAccountId,
        startLatitude: dto.latitude,
        startLongitude: dto.longitude,
        routePath: dto.latitude && dto.longitude
          ? [{ lat: dto.latitude, lng: dto.longitude, timestamp: Date.now() }]
          : [],
      },
    });
  }

  async addPhoto(walkId: string, petAccountId: string, dto: AddPhotoDto) {
    const walk = await this.getOwnWalk(walkId, petAccountId);
    return this.prisma.walkSession.update({
      where: { id: walk.id },
      data: {
        photos: { push: dto.photoUrl },
      },
    });
  }

  async updateLocation(walkId: string, petAccountId: string, dto: UpdateLocationDto) {
    const walk = await this.getOwnWalk(walkId, petAccountId);
    const currentPath = (walk.routePath as Array<{ lat: number; lng: number; timestamp: number }>) || [];
    const newPoint = { lat: dto.latitude, lng: dto.longitude, timestamp: Date.now() };

    return this.prisma.walkSession.update({
      where: { id: walk.id },
      data: {
        routePath: [...currentPath, newPoint],
      },
    });
  }

  async endWalk(walkId: string, petAccountId: string, dto: EndWalkDto) {
    const walk = await this.getOwnWalk(walkId, petAccountId);

    const petAccount = await this.prisma.petAccount.findUnique({
      where: { id: petAccountId },
      select: { name: true },
    });

    const duration = dto.duration || 0;
    const distance = dto.distance || 0;
    const minutes = Math.floor(duration / 60);
    const distanceStr = distance >= 1000
      ? `${(distance / 1000).toFixed(1)}km`
      : `${Math.round(distance)}m`;

    let postId: string | undefined;
    if (walk.photos.length > 0) {
      const post = await this.postService.create(petAccountId, {
        content: `🐾 ${petAccount?.name || '펫'}의 산책\n${minutes}분 • ${distanceStr}`,
        images: walk.photos,
      });
      postId = post.id;
    }

    // Create activity record
    await this.prisma.activity.create({
      data: {
        petAccountId,
        type: 'WALK',
        title: `${petAccount?.name || '펫'}의 산책`,
        duration,
        distance,
        routePath: walk.routePath ?? undefined,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    return this.prisma.walkSession.update({
      where: { id: walk.id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        endLatitude: dto.latitude,
        endLongitude: dto.longitude,
        duration,
        distance,
        postId,
      },
      include: {
        post: {
          select: { id: true },
        },
      },
    });
  }

  async cancelWalk(walkId: string, petAccountId: string) {
    const walk = await this.getOwnWalk(walkId, petAccountId);
    return this.prisma.walkSession.update({
      where: { id: walk.id },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
      },
    });
  }

  async getCurrentWalk(petAccountId: string) {
    return this.prisma.walkSession.findFirst({
      where: { petAccountId, status: 'WALKING' },
    });
  }

  async getWalkHistory(petAccountId: string, limit: number = 20, cursor?: string) {
    const walks = await this.prisma.walkSession.findMany({
      where: {
        petAccountId,
        status: 'COMPLETED',
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const nextCursor =
      walks.length === limit
        ? walks[walks.length - 1].createdAt.toISOString()
        : null;

    return { walks, nextCursor };
  }

  async getWalkById(walkId: string) {
    const walk = await this.prisma.walkSession.findUnique({
      where: { id: walkId },
      include: {
        petAccount: {
          select: { id: true, name: true, profileImage: true, species: true },
        },
        post: {
          select: { id: true },
        },
      },
    });
    if (!walk) {
      throw new NotFoundException('Walk session not found');
    }
    return walk;
  }

  async getFriendsWalking(petAccountId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: petAccountId },
          { receiverId: petAccountId },
        ],
      },
      select: { requesterId: true, receiverId: true },
    });

    const friendIds = friendships.map((f) =>
      f.requesterId === petAccountId ? f.receiverId : f.requesterId,
    );

    if (friendIds.length === 0) return [];

    const walkingSessions = await this.prisma.walkSession.findMany({
      where: {
        petAccountId: { in: friendIds },
        status: 'WALKING',
      },
      include: {
        petAccount: {
          select: { id: true, name: true, profileImage: true, species: true },
        },
      },
    });

    return walkingSessions.map((s) => ({
      petAccount: s.petAccount,
      walkSessionId: s.id,
      startedAt: s.startedAt,
    }));
  }

  private async getOwnWalk(walkId: string, petAccountId: string) {
    const walk = await this.prisma.walkSession.findUnique({
      where: { id: walkId },
    });
    if (!walk) {
      throw new NotFoundException('Walk session not found');
    }
    if (walk.petAccountId !== petAccountId) {
      throw new ForbiddenException('Not your walk session');
    }
    if (walk.status !== 'WALKING') {
      throw new ConflictException('Walk session is not active');
    }
    return walk;
  }
}
