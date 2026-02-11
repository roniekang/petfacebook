import type { MediaType } from './post';

export interface Story {
  id: string;
  petAccountId: string;
  mediaUrl: string;
  mediaType: MediaType;
  effectType?: string;
  geoTag?: string;
  latitude?: number;
  longitude?: number;
  expiresAt: Date;
  createdAt: Date;
  petAccount?: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export interface CreateStoryRequest {
  mediaUrl: string;
  mediaType: MediaType;
  geoTag?: string;
  latitude?: number;
  longitude?: number;
}

export interface StoryFeedGroup {
  petAccount: {
    id: string;
    name: string;
    profileImage?: string;
  };
  stories: Story[];
  latestAt: Date;
}

export interface StoryFeedResponse {
  storyGroups: StoryFeedGroup[];
}
