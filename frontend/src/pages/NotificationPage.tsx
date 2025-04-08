import { Heart, MessageCircle, Settings, User, XIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotificationStore } from "../store/useNotificationStore";
import { useSocketStore }  from "../store/useSocketStore";
import { useEffect } from "react";

const NotificationPage = () => {
  const {
    notifications,
    isFetchingNotifications,
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
  } = useNotificationStore();


  useEffect(() => {
    const { disconnectNotificationCount } = useSocketStore.getState();

    fetchNotifications();
    disconnectNotificationCount();
  }, [fetchNotifications ]);

  const handleDeleteAllNotifications = () => {
    deleteAllNotifications();
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotification(notificationId);
  };
  return (
    <>
      {/* Notifications Header*/}
      <div className="flex justify-between items-center p-4">
        <p className="font-bold text-2xl">Notifications</p>
        <div className="dropdown dropdown-left ">
          <div tabIndex={0} role="button" className="m-1">
            <Settings className="w-8" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 text-red-400"
          >
            <li>
              <a onClick={handleDeleteAllNotifications}>
                Delete all notifications
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Notifications Loading*/}
      {isFetchingNotifications && (
        <div className="flex justify-center h-full items-center">
          <p>Loading...</p>
        </div>
      )}
      {/* No Notifications Message*/}
      {notifications?.length === 0 && (
        <div className="text-center p-4 text-base-content/60 font-semibold">
          You Have No Notifications
        </div>
      )}

      {/* Notifications List*/}
      {notifications?.map((notification) => (
        <div
          className="bg-transparent/25 rounded-2xl mb-1 hover:translate-y-[-2px] hover:bg-transparent/15 transition-all ease-in duration-150 w-full"
          key={notification._id}
        >
          <div className="flex justify-between w-full ">
            <div className="flex gap-5 p-5">
              {notification.type === "follow" && (
                <User className="my-auto w-8 h-8 text-primary" />
              )}
              {notification.type === "like" && (
                <Heart className="my-auto w-8 h-8 text-red-500" />
              )}
              {notification.type === "comment" && (
                <MessageCircle className="my-auto w-8 h-8 text-grey-500" />
              )}

              <Link to={`/profile/${notification.from.username}`}>
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    <img src={notification.from.profilePic || "/avatar.png"} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="font-bold">
                    @{notification.from.username}
                  </span>{" "}
                  {notification.type === "follow"
                    ? "followed you"
                    : notification.type === "like"
                    ? "liked your post"
                    : notification.type === "comment"
                    ? "commented on your post"
                    : ""}
                </div>
              </Link>
            </div>
            <div className="my-auto p-5">
              <XIcon
                onClick={() => handleDeleteNotification(notification._id)}
                className="w-8 cursor-pointer"
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
export default NotificationPage;
