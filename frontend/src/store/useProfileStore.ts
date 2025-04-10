/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { UserProfile, SuggestedUser } from "../types/users";
import toast from "react-hot-toast";

interface ProfileState {
    selectedUser: UserProfile | null;
    suggestedUsers: SuggestedUser[] | null;

    isLoading: boolean;
    isFollowingUnfollowing: boolean;
    isFetchingSuggestedUser: boolean;

    fetchProfile: (username: string) => Promise<void>;
    fetchSuggestedUsers: () => Promise<void>;

    followUnfollowUser: (id: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
    selectedUser: null,
    suggestedUsers: [],

    isLoading: false,
    isFollowingUnfollowing: false,
    isFetchingSuggestedUser: false,

    fetchProfile: async (username: string) => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get(`/users/${username}/profile`);
            set({ selectedUser: res.data });
        } catch (error: any) {
            console.log("Error in fetchUserProfile controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchSuggestedUsers: async () => {
        set({ isFetchingSuggestedUser: true });
        try {
            const res = await axiosInstance.get("/users/suggested");
            const suggestedUsersWithIsFollowing = res.data.map((user: SuggestedUser) => ({
                ...user,
                isFollowing: false
            }));
            set({ suggestedUsers: suggestedUsersWithIsFollowing });
        } catch (error) {
            console.log("Error in fetchSuggestedUsers controller", error);
        } finally {
            set({ isFetchingSuggestedUser: false });
        }
    },

    followUnfollowUser: async (id: string) => {
        set({ isFollowingUnfollowing: true });
        try {
            const { data } = await axiosInstance.post(`/users/${id}/followUnfollow`);
            set((state) => ({
                selectedUser: data.data,
                suggestedUsers: state.suggestedUsers?.map((user) =>
                    user._id === id ? { ...user, isFollowing: !user.isFollowing } : user
                ),
            }));
            toast.success(data.message);
        } catch (error: any) {
            console.log("Error in followUnfollowUser controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isFollowingUnfollowing: false });
        }
    },
}));