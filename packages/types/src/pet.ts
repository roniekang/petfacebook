export type PetSpecies =
  | "DOG"
  | "CAT"
  | "BIRD"
  | "RABBIT"
  | "HAMSTER"
  | "FISH"
  | "REPTILE"
  | "OTHER";

export type PetGender = "MALE" | "FEMALE" | "NEUTERED_MALE" | "SPAYED_FEMALE";

export type PetStatus = "ACTIVE" | "HAVEN";

export interface PetAccount {
  id: string;
  guardianId: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  birthDate?: Date;
  gender?: PetGender;
  profileImage?: string;
  bio?: string;
  personality: string[];
  favorites: string[];
  regionCode?: string;
  regionName?: string;
  latitude?: number;
  longitude?: number;
  status: PetStatus;
  havenDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePetRequest {
  name: string;
  species: PetSpecies;
  breed?: string;
  birthDate?: string;
  gender?: PetGender;
  profileImage?: string;
  bio?: string;
  personality?: string[];
  favorites?: string[];
}

export interface UpdatePetRequest {
  name?: string;
  breed?: string;
  gender?: PetGender;
  profileImage?: string;
  bio?: string;
  personality?: string[];
  favorites?: string[];
}

export type GuardianRole = "OWNER" | "ADMIN" | "MEMBER";
export type GuardianStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface PetGuardian {
  id: string;
  petAccountId: string;
  guardianId: string;
  role: GuardianRole;
  status: GuardianStatus;
  invitedBy?: string;
  createdAt: Date;
  acceptedAt?: Date;
  guardian?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  petAccount?: PetAccount;
}
