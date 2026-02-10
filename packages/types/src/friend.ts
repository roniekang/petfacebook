export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type FriendMethod = "QR_CODE" | "NEARBY" | "SEARCH" | "RECOMMENDATION";

export interface Friendship {
  id: string;
  requesterId: string;
  receiverId: string;
  status: FriendshipStatus;
  method: FriendMethod;
  createdAt: Date;
  acceptedAt?: Date;
}

export interface FriendRequest {
  receiverId: string;
  method: FriendMethod;
}

export interface NearbyPet {
  id: string;
  name: string;
  species: string;
  profileImage?: string;
  distance: number;
}
