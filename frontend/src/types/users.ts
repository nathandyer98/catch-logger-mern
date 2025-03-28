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
    followers: [];
    following: [];
}

export interface SuggestedUser {
    _id: string;
    username: string;
    fullName: string;
    profilePic: string;
    isFollowing: boolean;
}