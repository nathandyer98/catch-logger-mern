/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { CatchFormData } from "../types/forms";
import { Catch } from "../types/catches";
import toast from "react-hot-toast";

interface CatchState {
    // feed will contain all catches that the user follows + their catches
    // user catches will display catches strictly from a user
    // explore will contain a random selection of catches
    exploreCatches: Catch[] | null;
    feedCatches: Catch[] | null;
    userCatches: Catch[] | null;

    isAddingCatch: boolean;
    isFetchingCatches: boolean;
    isAddingComment: boolean;
    isUpdatingComment: boolean;
    isDeletingComment: boolean;

    fetchExploreFeed: () => Promise<void>;
    fetchCatchesFeed: () => Promise<void>;
    fetchUserCatches: (username: string) => Promise<void>;
    likeUnlikeCatch: (id: string) => Promise<void>;

    addCatch: (formData: CatchFormData) => Promise<void>;
    deleteCatch: (id: string) => Promise<void>;

    addComment: (id: string, text: string) => Promise<void>;
    updateComment: (id: string, commentId: string, text: string) => Promise<void>;
    deleteComment: (id: string, commentId: string) => Promise<void>;
}

export const useCatchStore = create<CatchState>((set) => ({
    feedCatches: null,
    userCatches: null,
    exploreCatches: null,

    isAddingCatch: false,
    isFetchingCatches: false,
    isAddingComment: false,
    isUpdatingComment: false,
    isDeletingComment: false,

    fetchExploreFeed: async () => {
        set({ isFetchingCatches: true });
        try {
            const res = await axiosInstance.get("/catches/");
            set({ exploreCatches: res.data });
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
    addCatch: async (formData: CatchFormData) => {
        set({ isAddingCatch: true });
        try {
            const res = await axiosInstance.post("/catches/", formData);
            toast.success("Catch added successfully");
            const newCatch = res.data;
            set((state) => ({
                feedCatches: [newCatch, ...(state.feedCatches || [])],
            }));
        } catch (error: any) {
            console.log("Error in add catch controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isAddingCatch: false });
        }
    },

    deleteCatch: async (id: string) => {
        try {
            await axiosInstance.delete(`/catches/${id}`);

            set((state) => ({
                feedCatches: state.feedCatches?.filter((catchPost) => catchPost._id !== id),
            }));

            toast.success("Catch deleted successfully");
        } catch (error: any) {
            console.log("Error in delete catch controller", error);
            toast.error(error.response.data.message);
        }
    },

    likeUnlikeCatch: async (id: string) => {
        try {
            const { data } = await axiosInstance.post(`/catches/${id}/like`);
            set((state) => ({
                feedCatches: state.feedCatches?.map((catchPost) => {
                    if (catchPost._id === id) {
                        catchPost.likes = data.data;
                        console.log(catchPost);
                    }
                    return catchPost;
                }),
            }));
        } catch (error: any) {
            console.log("Error in likeUnlikeCatch controller", error);
            toast.error(error.response.data.message);
        }
    },

    addComment: async (id: string, text: string) => {
        set({ isAddingComment: true });
        try {
            const { data } = await axiosInstance.post(`/catches/${id}/comments`, { text });
            set((state) => ({
                feedCatches: state.feedCatches?.map((catchPost) => {
                    if (catchPost._id === id) {
                        catchPost.comments = data.comments;
                    }
                    return catchPost;
                }),
            }));
            toast.success("Comment added successfully");
        } catch (error: any) {
            console.log("Error in addComment controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isAddingComment: false });
        }
    },

    updateComment: async (id: string, commentId: string, text: string) => {
        set({ isUpdatingComment: true });
        try {
            const { data } = await axiosInstance.put(`/catches/${id}/comments/${commentId}`, { text });
            set((state) => ({
                feedCatches: state.feedCatches?.map((catchPost) => {
                    if (catchPost._id === id) {
                        catchPost.comments = data.comments;
                    }
                    return catchPost;
                }),
            }))
            // console.log(data)
            toast.success("Comment updated successfully");
        } catch (error: any) {
            console.log("Error in addComment controller", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isUpdatingComment: false });
        }
    },

    deleteComment: async (id: string, commentId: string) => {
        try {
            await axiosInstance.delete(`/catches/${id}/comments/${commentId}`);
            set((state) => ({
                feedCatches: state.feedCatches?.map((catchPost) => {
                    if (catchPost._id === id) {
                        catchPost.comments = catchPost.comments.filter((comment) => comment._id !== commentId);
                    }
                    return catchPost;
                }),
            }));
            toast.success("Comment deleted successfully");
        } catch (error: any) {
            console.log("Error in deleteComment controller", error);
            toast.error(error.response.data.message);
        }
    },


}));