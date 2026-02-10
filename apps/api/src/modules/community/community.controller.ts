import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  async list() {
    return this.communityService.list();
  }

  @Post()
  async create(@Body() body: { name: string; description?: string }) {
    return this.communityService.create(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.communityService.findOne(id);
  }

  @Post(':id/join')
  async join(@Param('id') id: string) {
    return this.communityService.join(id);
  }
}
