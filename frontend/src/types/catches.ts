export interface Catch {
    species: string;
    weight: number;
    lake: string;
    dateCaught: Date;
    photo?: string;
    rig?: string;
    bait?: string;
    distance?: number;
    location?: string;
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
    user: {username: string, fullName: string, profilePic?: string};
}