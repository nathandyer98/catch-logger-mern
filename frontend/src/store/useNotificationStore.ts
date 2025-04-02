/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { Notification, NotificationHandler, NotificationCountHandler } from "../types/notifcations";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

interface NotificationState {
    notifications: Notification[] | null;
    notificationsCount: number | null;

    isFetchingNotifications: boolean;

    fetchNotifications: () => Promise<void>;
    getNotificationsCount: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    deleteAllNotifications: () => Promise<void>;

    //Socket.io Functions
    _notificationHandlerRef: NotificationHandler | null;
    _notificationCountHandlerRef: NotificationCountHandler | null;
    _setHandlers: (handler: { notificationHandler: NotificationHandler | null; notificationCountHandler: NotificationCountHandler | null }) => void;

    subscribeToNotifications: () => void;
    unsubscribeFromNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
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

    //Socket.io Functions
    _notificationHandlerRef: null,
    _notificationCountHandlerRef: null,
    _setHandlers: (handler) => {
        set({
            _notificationHandlerRef: handler.notificationHandler,
            _notificationCountHandlerRef: handler.notificationCountHandler
        });
    },

    subscribeToNotifications: () => {
        const socket = useAuthStore.getState().socket;

        if (!socket || get()._notificationHandlerRef) {
            console.log("Socket unavailable or notificationHandler is already subscribed");
            return;
        }
        const notificationHandler: NotificationHandler = (notification) => {
            set((state) => ({
                notifications: [notification, ...state.notifications ?? []],
            }));
        }
        const notificationCountHandler: NotificationCountHandler = (count) => {
            set({ notificationsCount: count });
        }

        get()._setHandlers({ notificationHandler, notificationCountHandler });

        socket.on("newNotification", notificationHandler);
        socket.on("updateNotificationCount", notificationCountHandler);

        console.log("Succcessfully subscribed to notifications");
    },

    unsubscribeFromNotifications: () => {
        const socket = useAuthStore.getState().socket;

        const storedNotificationHandler = get()._notificationHandlerRef;
        const storedNotificationCountHandler = get()._notificationCountHandlerRef;

        console.log("Attempting to unsubscribe from notifications");

        if (socket) {
            if (storedNotificationHandler) {
                socket.off("newNotification", storedNotificationHandler);
                console.log("Succcessfully unsubscribed from notifications");
            }
            if (storedNotificationCountHandler) {
                socket.off("newNotificationCount", storedNotificationCountHandler);
                console.log("Succcessfully unsubscribed from notificationCount");
            }
            get()._setHandlers({ notificationHandler: null, notificationCountHandler: null });
        } else {
            console.log("Socket unavailable");
            if (storedNotificationHandler || storedNotificationCountHandler) {
                get()._setHandlers({ notificationHandler: null, notificationCountHandler: null });
            }
        }
    },
}));  
