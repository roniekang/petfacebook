import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { HavenService } from './haven.service';

@Controller('haven')
export class HavenController {
  constructor(private readonly havenService: HavenService) {}

  @Post('pets/:id/haven')
  async createHaven(@Param('id') id: string, @Body() body: { message?: string }) {
    return this.havenService.createHaven(id, body);
  }

  @Get(':petId')
  async getHaven(@Param('petId') petId: string) {
    return this.havenService.getHaven(petId);
  }

  @Post(':petId/memories')
  async addMemory(@Param('petId') petId: string, @Body() body: { content: string; imageUrl?: string }) {
    return this.havenService.addMemory(petId, body);
  }

  @Post(':petId/condolence')
  async addCondolence(@Param('petId') petId: string, @Body() body: { message: string }) {
    return this.havenService.addCondolence(petId, body.message);
  }
}
