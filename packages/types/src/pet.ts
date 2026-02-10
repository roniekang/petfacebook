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
