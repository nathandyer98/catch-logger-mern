/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { Participant } from "../types/users";

interface ParticipantState {
    searchedUsers: Participant[];
    selectedUsers: Participant[];

    isSearchingUsers: boolean;


    searchUsers: (username: string) => Promise<void>;
    setSearchedUsers: (users: Participant[]) => void;

    setSelectedUsers: (user: Participant[]) => void;
}

export const useParticipantStore = create<ParticipantState>((set) => ({
    searchedUsers: [],
    selectedUsers: [],

    isSearchingUsers: false,

    searchUsers: async (username: string) => {
        set({ isSearchingUsers: true });
        try {
            const res = await axiosInstance.get(`/users/search`, { params: { username }, withCredentials: true });
            set({ searchedUsers: res.data, });
        } catch (error: any) {
            console.error("Error searching users:", error);
        } finally {
            set({ isSearchingUsers: false });
        }
    },

    setSearchedUsers: (users: Participant[]) => {
        set({ searchedUsers: users });
    },

    setSelectedUsers: (user: Participant[]) => {
        set({ selectedUsers: user });
    },

}));


