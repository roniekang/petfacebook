import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateStoryDto } from './dto/story.dto';

@Injectable()
export class StoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(petAccountId: string, dto: CreateStoryDto) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.story.create({
      data: {
        petAccountId,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        geoTag: dto.geoTag,
        latitude: dto.latitude,
        longitude: dto.longitude,
        expiresAt,
      },
      include: {
        petAccount: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });
  }

  async getFeed(petAccountId: string) {
    // Get friend pet IDs (both directions)
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

    const friendPetIds = friendships.map((f) =>
      f.requesterId === petAccountId ? f.receiverId : f.requesterId,
    );

    const feedPetIds = [petAccountId, ...friendPetIds];

    // Get non-expired stories
    const stories = await this.prisma.story.findMany({
      where: {
        petAccountId: { in: feedPetIds },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        petAccount: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });

    // Group by petAccount
    const groupMap = new Map<string, {
      petAccount: { id: string; name: string; profileImage: string | null };
      stories: typeof stories;
      latestAt: Date;
    }>();

    for (const story of stories) {
      const pid = story.petAccountId;
      if (!groupMap.has(pid)) {
        groupMap.set(pid, {
          petAccount: story.petAccount,
          stories: [],
          latestAt: story.createdAt,
        });
      }
      const group = groupMap.get(pid)!;
      group.stories.push(story);
      if (story.createdAt > group.latestAt) {
        group.latestAt = story.createdAt;
      }
    }

    // Separate own group and others
    const ownGroup = groupMap.get(petAccountId);
    groupMap.delete(petAccountId);

    const otherGroups = Array.from(groupMap.values()).sort(
      (a, b) => b.latestAt.getTime() - a.latestAt.getTime(),
    );

    const storyGroups = ownGroup ? [ownGroup, ...otherGroups] : otherGroups;

    return { storyGroups };
  }

  async findOne(id: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        petAccount: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });
    if (!story) {
      throw new NotFoundException('Story not found');
    }
    return story;
  }

  async delete(id: string, petAccountId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
    });
    if (!story) {
      throw new NotFoundException('Story not found');
    }
    if (story.petAccountId !== petAccountId) {
      throw new ForbiddenException('Cannot delete another pet\'s story');
    }
    await this.prisma.story.delete({ where: { id } });
    return { deleted: true };
  }
}
