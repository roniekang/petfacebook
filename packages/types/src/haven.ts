export type HavenItemCategory =
  | "BACKGROUND"
  | "DECORATION"
  | "FLOWER"
  | "CANDLE"
  | "FRAME"
  | "MUSIC";

export interface HavenMemorial {
  id: string;
  petAccountId: string;
  tributeMessage?: string;
  coverImage?: string;
  createdAt: Date;
}

export interface HavenMemory {
  id: string;
  memorialId: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption?: string;
  memoryDate?: Date;
  createdAt: Date;
}

export interface HavenTribute {
  id: string;
  memorialId: string;
  petAccountId: string;
  message: string;
  createdAt: Date;
}

export interface HavenShopItem {
  id: string;
  name: string;
  description?: string;
  category: HavenItemCategory;
  imageUrl?: string;
  price: number;
  isActive: boolean;
}

export interface SendCondolenceRequest {
  amount: number;
  message?: string;
}

export interface PurchaseHavenItemRequest {
  memorialId: string;
  itemId: string;
}
