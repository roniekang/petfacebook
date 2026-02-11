import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentPet } from '../../common/decorators/current-pet.decorator';
import { FriendRequestDto } from './dto/friend-request.dto';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('request')
  async sendRequest(
    @CurrentPet('id') petAccountId: string,
    @Body() dto: FriendRequestDto,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.friendService.sendRequest(petAccountId, dto);
  }

  @Post('requests/:id/accept')
  async acceptRequest(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.friendService.acceptRequest(id, petAccountId);
  }

  @Post('requests/:id/reject')
  async rejectRequest(
    @Param('id') id: string,
    @CurrentPet('id') petAccountId: string,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.friendService.rejectRequest(id, petAccountId);
  }

  @Get()
  async list(@CurrentPet('id') petAccountId: string) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.friendService.list(petAccountId);
  }

  @Get('requests')
  async pendingRequests(@CurrentPet('id') petAccountId: string) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.friendService.pendingRequests(petAccountId);
  }

  @Get('nearby')
  async nearby(
    @CurrentPet('id') petAccountId: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    if (!lat || !lng) {
      throw new BadRequestException('lat and lng query parameters required');
    }
    return this.friendService.nearby(
      petAccountId,
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 5,
    );
  }

  @Get('qr-data')
  async getQrData(@CurrentPet('id') petAccountId: string) {
    if (!petAccountId) {
      throw new BadRequestException('x-pet-account-id header required');
    }
    return this.friendService.getQrData(petAccountId);
  }
}
