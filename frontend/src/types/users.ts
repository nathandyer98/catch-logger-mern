export interface User {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    profilePic: string;
    bio: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfile extends User {
    followers: string[];
    following: string[];
}

export interface SuggestedUser {
    _id: string;
    username: string;
    fullName: string;
    profilePic: string;
    isFollowing: boolean;
}

export interface Participant {
    _id: string;
    username: string;
    fullName: string;
    profilePic: string;
}