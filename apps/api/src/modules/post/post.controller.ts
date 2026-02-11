import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentPet } from '../../common/decorators/current-pet.decorator';
import { CreatePostDto, CreateCommentDto } from './dto/create-post.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async create(
    @CurrentPet('id') petAccountId: string,
    @Body() dto: CreatePostDto,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.postService.create(petAccountId, dto);
  }

  @Get('feed')
  async getFeed(
    @CurrentPet('id') petAccountId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.postService.getFeed(
      petAccountId,
      cursor,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('pet/:petAccountId')
  async getByPetAccount(
    @Param('petAccountId') petAccountId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.getByPetAccount(
      petAccountId,
      cursor,
      limit ? parseInt(limit, 10) : 24,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
  ) {
    return this.postService.findOne(id, petAccountId);
  }

  @Post(':id/like')
  async like(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.postService.like(id, petAccountId);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
    @Body() dto: CreateCommentDto,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.postService.addComment(id, petAccountId, dto);
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.postService.getComments(id);
  }
}
