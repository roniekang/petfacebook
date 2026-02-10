import { Controller, Get, Post, Body } from '@nestjs/common';
import { CoinService } from './coin.service';

@Controller('coins')
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @Get('wallet')
  async getWallet() {
    return this.coinService.getWallet();
  }

  @Get('transactions')
  async getTransactions() {
    return this.coinService.getTransactions();
  }

  @Post('haven-items/purchase')
  async purchaseHavenItem(@Body() body: { itemId: string; quantity?: number }) {
    return this.coinService.purchaseHavenItem(body);
  }
}
