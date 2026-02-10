import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { WalkService } from './walk.service';

@Controller('walks')
export class WalkController {
  constructor(private readonly walkService: WalkService) {}

  @Post('start')
  async start(@Body() body: { petId: string }) {
    return this.walkService.start(body.petId);
  }

  @Post(':id/end')
  async end(@Param('id') id: string) {
    return this.walkService.end(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.walkService.findOne(id);
  }

  @Get()
  async list() {
    return this.walkService.list();
  }
}
