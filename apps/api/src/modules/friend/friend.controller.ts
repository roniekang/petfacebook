import { Controller, Get, Post, Param } from '@nestjs/common';
import { FriendService } from './friend.service';

@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  async list() {
    return this.friendService.list();
  }

  @Post('requests/:id/accept')
  async acceptRequest(@Param('id') id: string) {
    return this.friendService.acceptRequest(id);
  }

  @Post('requests/:id/reject')
  async rejectRequest(@Param('id') id: string) {
    return this.friendService.rejectRequest(id);
  }

  @Get('nearby')
  async nearby() {
    return this.friendService.nearby();
  }
}
