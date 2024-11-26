/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { User } from "../types/user";
import { SignupFormData } from "../types/forms";
import toast from "react-hot-toast";



interface AuthState {
    authenticatedUser: User | null;
    isSigningUp: boolean;
    isLoggingIn: boolean;
    isUpdatingProfile: boolean;
    isCheckingAuth: boolean;
    checkAuth: () => Promise<void>;
    signup: (formData: SignupFormData) => Promise<void>;
    logout: () => Promise<void>;
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
        } catch (error: any) {
            console.log("Error in checkAuth controller", error);
            set({ authenticatedUser: null });
        } finally {
            set({isCheckingAuth: false});
        }
    },

    signup: async (formData: SignupFormData) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", formData);
            set({ authenticatedUser: res.data });
            toast.success("Account created successfully");
        } catch (error: any) {
            console.log("Error in signup controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },
    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authenticatedUser: null });
            toast.success("Logged out successfully");
        } catch (error: any) {
            console.log("Error in logout controller", error);
            toast.error(error.response.data.message);
        }
    }
}));