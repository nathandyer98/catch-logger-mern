import { FishSpecies } from "../enum/FishSpecies";

export interface SignupFormData {
    fullName: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface UpdateProfileData {
    fullName?: string;
    profilePic?: string;
}

export interface CatchFormData {
    species: FishSpecies;
    weight: number;
    lake: string;
    dateCaught: Date;
    photo?: string;
    rig?: string;
    bait?: string;
    distance?: number;
    location?: string;
    comments?: string;
}