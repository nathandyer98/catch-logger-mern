export interface SignupFormData {
    fullName: string;
    email: string;
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