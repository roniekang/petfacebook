import { Injectable } from '@nestjs/common';

@Injectable()
export class FriendService {
  async list() {
    // TODO: Implement friend list retrieval for the current pet
    return { message: 'list placeholder' };
  }

  async acceptRequest(requestId: string) {
    // TODO: Implement friend request acceptance
    return { message: 'acceptRequest placeholder', requestId };
  }

  async rejectRequest(requestId: string) {
    // TODO: Implement friend request rejection
    return { message: 'rejectRequest placeholder', requestId };
  }

  async nearby() {
    // TODO: Implement nearby pets discovery using geolocation
    return { message: 'nearby placeholder' };
  }
}
