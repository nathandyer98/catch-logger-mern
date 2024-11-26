import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { User } from "../types/user";
import { SignupFormData } from "../types/forms";



interface AuthState {
    authenticatedUser: User | null;
    isSigningUp: boolean;
    isLoggingIn: boolean;
    isUpdatingProfile: boolean;
    isCheckingAuth: boolean;
    checkAuth: () => Promise<void>;
    signup: (formData: SignupFormData) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    authenticatedUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,

    isCheckingAuth: false,


    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authenticatedUser: res.data });
        } catch (error) {
            console.log("Error in checkAuth controller", error);
            set({ authenticatedUser: null });
            
        } finally {
            set({isCheckingAuth: false});
        }
    },

    signup: async (formData: SignupFormData) => {
        
    }
}));