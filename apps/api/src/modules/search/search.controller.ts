import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentPet } from '../../common/decorators/current-pet.decorator';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('pets')
  async searchPets(
    @Query('q') query: string,
    @CurrentPet('id') petAccountId: string,
  ) {
    return this.searchService.searchPets(query, petAccountId);
  }
}
