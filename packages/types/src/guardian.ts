export type AuthProvider = "EMAIL" | "GOOGLE" | "KAKAO" | "NAVER";

export interface Guardian {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  provider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  guardian: Guardian;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  profileImage?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
