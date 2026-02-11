import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WalkService } from './walk.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentPet } from '../../common/decorators/current-pet.decorator';
import { StartWalkDto, AddPhotoDto, UpdateLocationDto, EndWalkDto } from './dto/walk.dto';

@Controller('walks')
@UseGuards(JwtAuthGuard)
export class WalkController {
  constructor(private readonly walkService: WalkService) {}

  @Post('start')
  async startWalk(
    @CurrentPet('id') petAccountId: string,
    @Body() dto: StartWalkDto,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.walkService.startWalk(petAccountId, dto);
  }

  @Patch(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.walkService.updateLocation(id, petAccountId, dto);
  }

  @Post(':id/photos')
  async addPhoto(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
    @Body() dto: AddPhotoDto,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.walkService.addPhoto(id, petAccountId, dto);
  }

  @Post(':id/end')
  async endWalk(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
    @Body() dto: EndWalkDto,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.walkService.endWalk(id, petAccountId, dto);
  }

  @Delete(':id')
  async cancelWalk(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.walkService.cancelWalk(id, petAccountId);
  }

  @Get('current')
  async getCurrentWalk(@CurrentPet('id') petAccountId: string) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.walkService.getCurrentWalk(petAccountId);
  }

  @Get('friends-walking')
  async getFriendsWalking(@CurrentPet('id') petAccountId: string) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.walkService.getFriendsWalking(petAccountId);
  }

  @Get('history')
  async getWalkHistory(
    @CurrentPet('id') petAccountId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.walkService.getWalkHistory(
      petAccountId,
      limit ? parseInt(limit, 10) : 20,
      cursor,
    );
  }

  @Get(':id')
  async getWalkById(@Param('id') id: string) {
    return this.walkService.getWalkById(id);
  }
}
