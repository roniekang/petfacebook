import { Injectable } from '@nestjs/common';

@Injectable()
export class PetService {
  async create(data: { name: string; species: string; breed?: string; age?: number }) {
    // TODO: Implement pet profile creation
    return { message: 'create placeholder', data };
  }

  async findOne(id: string) {
    // TODO: Implement pet profile retrieval by ID
    return { message: 'findOne placeholder', id };
  }

  async update(id: string, data: Partial<{ name: string; species: string; breed: string; age: number }>) {
    // TODO: Implement pet profile update
    return { message: 'update placeholder', id, data };
  }

  async remove(id: string) {
    // TODO: Implement pet profile deletion
    return { message: 'remove placeholder', id };
  }

  async friendRequest(petId: string, targetPetId: string) {
    // TODO: Implement friend request between pets (친구 추가)
    return { message: 'friendRequest placeholder', petId, targetPetId };
  }
}
