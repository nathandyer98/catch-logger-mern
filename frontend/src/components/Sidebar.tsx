import { Bell, Home, MessageSquare, Settings, User, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useEffect } from "react";

const Sidebar = () => {
  const { authenticatedUser } = useAuthStore();

  const { notificationsCount, getNotificationsCount } = useNotificationStore();

  useEffect(() => {
    getNotificationsCount();
    const interval = setInterval(getNotificationsCount, 30000);
    return () => clearInterval(interval);
  }, [getNotificationsCount]);

  return (
    <div className="">
      {/* Navigation Links */}
      <nav className="flex flex-col rounded-2xl w-auto">
        <NavItem label="Home" icon={<Home size={24} />} path="/" />
        <NavItem label="Groups" icon={<Users size={24} />} path="/" />
        <NavItem
          label="Notifications"
          icon={<Bell size={24} />}
          path="/notifications"
          number={notificationsCount ?? 0}
        />
        <NavItem label="Messages" icon={<MessageSquare size={24} />} path="/" />
        <NavItem
          label="Profile"
          icon={<User size={24} />}
          path={`/profile/${authenticatedUser?.username}`}
        />
        <NavItem
          label="Settings"
          icon={<Settings size={24} />}
          path="/settings"
        />
      </nav>
    </div>
  );
};

// Navigation Item
type NavItemProps = {
  label: string;
  icon: React.ReactNode;
  path: string;
  number?: number;
};

const NavItem: React.FC<NavItemProps> = ({ label, icon, path, number }) => {
  return (
    <Link
      to={path}
      className="flex items-center gap-3 px-4 py-3 text-white/90 transition-all duration-400 hover:bg-base-300 hover:rounded-xl"
    >
      <div className="relative">
        <div className="text-primary">{icon}</div>
        {number !== undefined && number > 0 && (
          <div className="absolute -top-[10px] -right-[5px]">
            <span className="bg-red-500/90 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] inline-block text-center">
              {number}
            </span>
          </div>
        )}
      </div>
      {/* Hide label on small screens */}
      <span className="text-sm font-semibold hidden md:block">{label}</span>
    </Link>
  );
};

export default Sidebar;
