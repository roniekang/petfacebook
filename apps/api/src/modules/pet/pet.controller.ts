import { Controller, Post, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { PetService } from './pet.service';

@Controller('pets')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Post()
  async create(@Body() body: { name: string; species: string; breed?: string; age?: number }) {
    return this.petService.create(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.petService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Partial<{ name: string; species: string; breed: string; age: number }>) {
    return this.petService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.petService.remove(id);
  }

  @Post(':id/friends/request')
  async friendRequest(@Param('id') id: string, @Body() body: { targetPetId: string }) {
    return this.petService.friendRequest(id, body.targetPetId);
  }
}
