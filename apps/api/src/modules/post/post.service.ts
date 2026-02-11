import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreatePostDto, CreateCommentDto } from './dto/create-post.dto';
import { Visibility } from '@pettopia/database';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async create(petAccountId: string, dto: CreatePostDto) {
    if (!dto.content && (!dto.images || dto.images.length === 0) && (!dto.videos || dto.videos.length === 0)) {
      throw new BadRequestException('Post must have content, images, or videos');
    }

    return this.prisma.post.create({
      data: {
        petAccountId,
        content: dto.content,
        images: dto.images || [],
        videos: dto.videos || [],
        visibility: dto.visibility || Visibility.PUBLIC,
        geoTag: dto.geoTag,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: {
        petAccount: {
          select: { id: true, name: true, profileImage: true, species: true },
        },
      },
    });
  }

  async getFeed(
    petAccountId: string,
    cursor?: string,
    limit: number = 20,
  ) {
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

    // Include own pet + friends
    const feedPetIds = [petAccountId, ...friendPetIds];

    const posts = await this.prisma.post.findMany({
      where: {
        petAccountId: { in: feedPetIds },
        visibility: { in: [Visibility.PUBLIC, Visibility.FRIENDS] },
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        petAccount: {
          select: { id: true, name: true, profileImage: true, species: true },
        },
        _count: { select: { comments: true, likes: true } },
      },
    });

    // Check which posts the current pet has liked
    const postIds = posts.map((p) => p.id);
    const myLikes = await this.prisma.like.findMany({
      where: {
        postId: { in: postIds },
        petAccountId,
      },
      select: { postId: true },
    });
    const likedPostIds = new Set(myLikes.map((l) => l.postId));

    const enrichedPosts = posts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));

    const nextCursor =
      posts.length === limit
        ? posts[posts.length - 1].createdAt.toISOString()
        : null;

    return { posts: enrichedPosts, nextCursor };
  }

  async getByPetAccount(petAccountId: string, cursor?: string, limit: number = 24) {
    const posts = await this.prisma.post.findMany({
      where: {
        petAccountId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        images: true,
        videos: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
      },
    });

    const nextCursor =
      posts.length === limit
        ? posts[posts.length - 1].createdAt.toISOString()
        : null;

    return { posts, nextCursor };
  }

  async findOne(postId: string, petAccountId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        petAccount: {
          select: { id: true, name: true, profileImage: true, species: true },
        },
        _count: { select: { comments: true, likes: true } },
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let isLiked = false;
    if (petAccountId) {
      const like = await this.prisma.like.findUnique({
        where: {
          postId_petAccountId: { postId, petAccountId },
        },
      });
      isLiked = !!like;
    }

    return { ...post, isLiked };
  }

  async like(postId: string, petAccountId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prisma.like.findUnique({
      where: {
        postId_petAccountId: { postId, petAccountId },
      },
    });

    if (existing) {
      // Unlike
      await this.prisma.$transaction([
        this.prisma.like.delete({ where: { id: existing.id } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      return { liked: false, likeCount: post.likeCount - 1 };
    } else {
      // Like
      await this.prisma.$transaction([
        this.prisma.like.create({
          data: { postId, petAccountId },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      return { liked: true, likeCount: post.likeCount + 1 };
    }
  }

  async addComment(
    postId: string,
    petAccountId: string,
    dto: CreateCommentDto,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          postId,
          petAccountId,
          content: dto.content,
          parentId: dto.parentId,
        },
        include: {
          petAccount: {
            select: { id: true, name: true, profileImage: true },
          },
        },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    return comment;
  }

  async getComments(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        petAccount: {
          select: { id: true, name: true, profileImage: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            petAccount: {
              select: { id: true, name: true, profileImage: true },
            },
          },
        },
      },
    });
  }
}
