import { Catch } from "./catches";

export interface User {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    profilePic: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfile extends User {
    friends: number;
    catches: Catch[];
}