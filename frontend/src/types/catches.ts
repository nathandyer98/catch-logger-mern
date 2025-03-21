interface Comment {
    _id: string;
    user: {_id: string, username: string, fullName: string, profilePic?: string};
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Catch {
    _id: string;
    species: string;
    weight: number;
    lake: string;
    dateCaught: Date;
    photo?: string;
    rig?: string;
    bait?: string;
    distance?: number;
    location?: string;
    text?: string;
    likes: string[];
    comments: Comment[];
    createdAt: Date;
    updatedAt: Date;
    user: {_id: string, username: string, fullName: string, profilePic?: string};
}