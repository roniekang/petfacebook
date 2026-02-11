export type WalkSessionStatus = 'WALKING' | 'COMPLETED' | 'CANCELLED';

export interface WalkSession {
  id: string;
  petAccountId: string;
  status: WalkSessionStatus;
  startedAt: string;
  endedAt?: string;
  routePath?: RoutePoint[];
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  duration?: number;
  distance?: number;
  photos: string[];
  postId?: string;
  createdAt: string;
  updatedAt: string;
  petAccount?: {
    id: string;
    name: string;
    profileImage?: string;
    species: string;
  };
  post?: {
    id: string;
  };
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface WalkHistoryResponse {
  walks: WalkSession[];
  nextCursor: string | null;
}

export interface FriendWalking {
  petAccount: {
    id: string;
    name: string;
    profileImage?: string;
    species: string;
  };
  walkSessionId: string;
  startedAt: string;
}
