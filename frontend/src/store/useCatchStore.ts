/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { CatchFormData } from "../types/forms";
import { Catch } from "../types/catches";
import toast from "react-hot-toast";

interface CatchState {
    feedCatches: Catch[] | null;
    userCatches: Catch[] | null;

    isAddingCatch: boolean;
    isFetchingCatches: boolean;

    addCatch: (formData: CatchFormData) => Promise<void>;
    fetchUserCatches: (username: string) => Promise<void>;
    fetchCatchesFeed: () => Promise<void>;
}

export const useCatchStore = create<CatchState>((set) => ({
    feedCatches: null,
    userCatches: null,

    isAddingCatch: false,
    isFetchingCatches: false,
    addCatch: async (formData: CatchFormData) => {
        set({ isAddingCatch: true });
        try {
            const res = await axiosInstance.post("/catches", formData);
            toast.success("Catch added successfully");
            const newCatch = res.data;
             set((state) => ({
                 feedCatches: [newCatch, ...(state.feedCatches || [])], }));
        } catch (error: any) {
            console.log("Error in add catch controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isAddingCatch: false });
        }
    },

    fetchUserCatches: async (username: string) => {
        set({ isFetchingCatches: true });
        try {
            const res = await axiosInstance.get(`/catches/user/${username}`);
            set({ userCatches: res.data });
        } catch (error: any) {
            console.log("Error in fetchCatches controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isFetchingCatches: false });
        }
    },

    fetchCatchesFeed: async () => {
        set({ isFetchingCatches: true });
        try {
            const res = await axiosInstance.get("/catches/feed");
            set({ feedCatches: res.data });
        } catch (error: any) {
            console.log("Error in fetchCatches controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isFetchingCatches: false });
        }
    },

}));