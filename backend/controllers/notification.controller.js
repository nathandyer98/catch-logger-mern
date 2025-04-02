import * as NotificationService from "../services/notification.service.js";
import { handleControllerError } from '../utils/errorHandler.js';


export const getNotifications = async (req, res) => {
    const userId = req.user._id;
    try {
        const notifications = await NotificationService.getNotifications(userId);
        res.status(200).json(notifications);
    } catch (error) {
        console.log("---Get Nofitications Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const getNotificationsCount = async (req, res) => {
    const userId = req.user._id;
    try {
        const count = await NotificationService.getNotificationsCount(userId);
        res.status(200).json({ count });
    } catch (error) {
        console.log("---Get Nofitications Count Controller Error---", error);
        handleControllerError(error, res)
    }
}


export const deleteNotifications = async (req, res) => {
    const userId = req.user._id;
    try {
        const message = await NotificationService.deleteNotifications(userId);
        res.status(200).json({ message });
    } catch (error) {
        console.log("---Delete Nofitications Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const deleteNotification = async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user._id;
    try {
        const message = await NotificationService.deleteNotification(notificationId, userId);
        res.status(200).json({ message });
    } catch (error) {
        console.log("---Delete Nofitication Controller Error---", error);
        handleControllerError(error, res)
    }
}