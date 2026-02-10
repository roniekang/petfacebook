import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('feed')
  async getFeed() {
    return this.postService.getFeed();
  }

  @Post()
  async create(
    @Body() body: { content: string; imageUrl?: string; geoTag?: { latitude: number; longitude: number } },
  ) {
    return this.postService.create(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Post(':id/like')
  async like(@Param('id') id: string) {
    return this.postService.like(id);
  }

  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Body() body: { content: string }) {
    return this.postService.addComment(id, body.content);
  }
}
