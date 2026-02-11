import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { StoryService } from './story.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentPet } from '../../common/decorators/current-pet.decorator';
import { CreateStoryDto } from './dto/story.dto';

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  async create(
    @CurrentPet('id') petAccountId: string,
    @Body() dto: CreateStoryDto,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.storyService.create(petAccountId, dto);
  }

  @Get('feed')
  async getFeed(@CurrentPet('id') petAccountId: string) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.storyService.getFeed(petAccountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.storyService.findOne(id);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.storyService.delete(id, petAccountId);
  }
}
