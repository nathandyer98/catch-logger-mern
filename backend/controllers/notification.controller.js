import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
    const userId = req.user._id;
    try {
        const notifications = await Notification.find({ to: userId }).populate('from', 'username profileImage').sort({ createdAt: -1 });

        await Notification.updateMany({ to: userId }, { read: true });

        res.status(200).json(notifications);
    } catch (error) {
        console.log(" Error in getNotifications ", error.message);
        res.status(500).json({ message: "Server Error" });

    }
}

export const deleteNotifications = async (req, res) => {
    const userId = req.user._id;
    try {
        await Notification.deleteMany({ to: userId });
        res.status(200).json({ message: "Notifications deleted successfully" });
    } catch (error) {
        console.log(" Error in deleteNotification ", error.message);
        res.status(500).json({ message: "Server Error" });
    }
}

export const deleteNotification = async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user._id;
    try {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.to.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this notification" });
        }
        
        await Notification.findByIdAndDelete(notificationId);
        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.log(" Error in deleteNotification ", error.message);
        res.status(500).json({ message: "Server Error" });
    }
}