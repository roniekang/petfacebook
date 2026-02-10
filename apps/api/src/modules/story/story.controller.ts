import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { StoryService } from './story.service';

@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  async list() {
    return this.storyService.list();
  }

  @Post()
  async create(@Body() body: { imageUrl: string; caption?: string }) {
    return this.storyService.create(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.storyService.findOne(id);
  }
}
