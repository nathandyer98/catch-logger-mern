/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { Notification } from "../types/notifcations";
import toast from "react-hot-toast";

interface NotificationState {
    notifications: Notification[] | null;
    notificationsCount: number | null;

    isFetchingNotifications: boolean;

    fetchNotifications: () => Promise<void>;
    getNotificationsCount: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    deleteAllNotifications: () => Promise<void>;
    addNotification: (notification: Notification) => void;
    setNotificationCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: null,
    notificationsCount: null,

    isFetchingNotifications: false,

    fetchNotifications: async () => {
        set({ isFetchingNotifications: true });
        try {
            const res = await axiosInstance.get("/notifications/");
            set({ notifications: res.data, notificationsCount: 0 });
        } catch (error: any) {
            console.log("Error in fetchNotifications controller", error);
        } finally {
            set({ isFetchingNotifications: false });
        }
    },

    getNotificationsCount: async () => {
        try {
            const res = await axiosInstance.get("/notifications/count");
            set({ notificationsCount: res.data.count });
        } catch (error: any) {
            console.log("Error in fetchNotifications controller", error);
        }
    },

    deleteNotification: async (notificationId: string) => {
        try {
            await axiosInstance.delete(`/notifications/${notificationId}`);
            set((state) => ({
                notifications: state.notifications?.filter((notification) => notification._id !== notificationId),
            }));
            toast.success("Notification deleted successfully");
        } catch (error: any) {
            console.log("Error in deleteNotification controller", error);
        }
    },

    deleteAllNotifications: async () => {
        try {
            await axiosInstance.delete("/notifications/");
            set({ notifications: [] });
            toast.success("All notifications deleted successfully");
        } catch (error: any) {
            console.log("Error in deleteAllNotifications controller", error);
        }
    },

    addNotification: (notification: Notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications ?? []],
        }));
    },

    setNotificationCount: (count: number) => {
        set({ notificationsCount: count });
    }
}));