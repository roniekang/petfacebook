export type CommunityRole = "ADMIN" | "MEMBER";

export interface Community {
  id: string;
  name: string;
  description?: string;
  regionCode?: string;
  regionName?: string;
  coverImage?: string;
  memberCount: number;
  createdById: string;
  createdAt: Date;
}

export interface CreateCommunityRequest {
  name: string;
  description?: string;
  coverImage?: string;
}
