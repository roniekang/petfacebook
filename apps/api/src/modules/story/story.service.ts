import { Injectable } from '@nestjs/common';

@Injectable()
export class StoryService {
  async list() {
    // TODO: Implement story feed retrieval
    return { message: 'list placeholder' };
  }

  async create(data: { imageUrl: string; caption?: string }) {
    // TODO: Implement story creation with 24h expiry
    return { message: 'create placeholder', data };
  }

  async findOne(id: string) {
    // TODO: Implement single story retrieval
    return { message: 'findOne placeholder', id };
  }
}
