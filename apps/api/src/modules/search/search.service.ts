import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchPets(query: string, currentPetId?: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const pets = await this.prisma.petAccount.findMany({
      where: {
        status: 'ACTIVE',
        ...(currentPetId ? { id: { not: currentPetId } } : {}),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { breed: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        profileImage: true,
        bio: true,
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    return pets;
  }
}
