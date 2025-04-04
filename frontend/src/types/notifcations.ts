import { NotificationTypes } from "../enum/NotificationTypes";

export interface Notification {
    _id: string;
    from: { _id: string, username: string, fullName: string, profilePic?: string };
    to: string;
    type: NotificationTypes;
    read: boolean;
    createdAt: Date;
}