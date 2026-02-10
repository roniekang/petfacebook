export type CoinTransactionType =
  | "CONDOLENCE_RECEIVED"
  | "ITEM_PURCHASE"
  | "REFUND";

export type CoinDirection = "IN" | "OUT";

export interface CoinWallet {
  id: string;
  petAccountId: string;
  balance: number;
  totalReceived: number;
  totalSpent: number;
  updatedAt: Date;
}

export interface CoinTransaction {
  id: string;
  walletId: string;
  type: CoinTransactionType;
  amount: number;
  direction: CoinDirection;
  referenceId?: string;
  description?: string;
  createdAt: Date;
}
