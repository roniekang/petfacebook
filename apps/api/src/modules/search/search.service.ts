import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  async search(query: string, type?: string) {
    // TODO: Implement unified search across pets, users, posts, and communities
    return { message: 'search placeholder', query, type };
  }
}
