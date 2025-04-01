/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { User } from "../types/users";
import { SignupFormData, LoginFormData, UpdateProfileData } from "../types/forms";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { useNotificationStore } from "./useNotificationStore";

const BASE_URL = "http://localhost:5001/"

interface AuthState {
    authenticatedUser: User | null;
    socket: Socket | null;

    isSigningUp: boolean;
    isLoggingIn: boolean;
    isUpdatingProfile: boolean;
    isCheckingAuth: boolean;

    checkAuth: () => Promise<void>;
    signup: (formData: SignupFormData) => Promise<void>;
    logout: () => Promise<void>;
    login: (formData: LoginFormData) => Promise<void>;
    updateProfile: (data: UpdateProfileData) => Promise<void>;

    //Socket Connection Functions
    connectSocket: () => void;
    disconnectSocket: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    authenticatedUser: null,
    socket: null,

    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: false,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authenticatedUser: res.data });
            get().connectSocket();
        } catch (error: any) {
            console.log("Error in checkAuth controller", error);
            set({ authenticatedUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (formData: SignupFormData) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", formData);
            set({ authenticatedUser: res.data });
            get().connectSocket();
            toast.success("Account created successfully");
        } catch (error: any) {
            console.log("Error in signup controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (formData: LoginFormData) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", formData);
            set({ authenticatedUser: res.data });
            get().connectSocket();
            toast.success("Logged in successfully");
        } catch (error: any) {
            console.log("Error in login controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authenticatedUser: null });
            get().disconnectSocket();
            toast.success("Logged out successfully");
        } catch (error: any) {
            console.log("Error in logout controller", error);
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (data: UpdateProfileData) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authenticatedUser: res.data });
            toast.success(data.fullName ? "Name updated successfully" : "Profile picture updated successfully");
        } catch (error: any) {
            console.log("Error in updateProfile controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: () => {
        const { authenticatedUser } = get();
        if (!authenticatedUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            auth: {
                userId: authenticatedUser._id
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
            console.log("AuthStore: Socket connected");
            set({ socket: socket });

            useNotificationStore.getState().subscribeToNotifications();
        });

        socket.on("disconnect", (reason) => {
            console.log("AuthStore: Socket disconnected", reason);

            useNotificationStore.getState().unsubscribeFromNotifications();
            set({ socket: null });
        })
    },
    disconnectSocket: () => {
        const socket = get().socket;

        if (socket?.connected) {
            console.log("AuthStore: Disconnecting socket");
            useNotificationStore.getState().unsubscribeFromNotifications();
            socket.disconnect();
        }
        set({ socket: null });
    },
}));