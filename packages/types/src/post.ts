export type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE";
export type MediaType = "IMAGE" | "VIDEO";

export interface Post {
  id: string;
  petAccountId: string;
  content?: string;
  images: string[];
  videos: string[];
  visibility: Visibility;
  geoTag?: string;
  latitude?: number;
  longitude?: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostRequest {
  content?: string;
  images?: string[];
  videos?: string[];
  visibility?: Visibility;
  geoTag?: string;
  latitude?: number;
  longitude?: number;
}

export interface Comment {
  id: string;
  postId: string;
  petAccountId: string;
  content: string;
  parentId?: string;
  createdAt: Date;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}
