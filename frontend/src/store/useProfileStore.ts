/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { UserProfile } from "../types/users";
import toast from "react-hot-toast";

interface ProfileState {
    selectedUser: UserProfile | null;
    isLoading: boolean;

    fetchProfile: (userId?: string) => Promise<void>;

}

export const useProfileStore = create<ProfileState>(( set ) => ({
    selectedUser: null,
    isLoading: false,

    fetchProfile: async (userId?: string) => {

        set({ isLoading: true });

        try {
            const endpoint = userId ? `/users/${userId}` : `/users/me`;
            const res = await axiosInstance.get(endpoint);

            set({ selectedUser: res.data });

        } catch (error: any) {
            console.log("Error in fetchUserProfile controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isLoading: false });
        }
    }
}));