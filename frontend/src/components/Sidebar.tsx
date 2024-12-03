import { Bell, Home, MessageSquare, Settings, User, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const Sidebar = () => {
  const { authenticatedUser } = useAuthStore();

  return (
    <div className="">
      {/* Navigation Links */}
      <nav className="flex flex-col rounded-2xl w-auto">
        <NavItem label="Home" icon={<Home size={24} />} path="/" />
        <NavItem label="Groups" icon={<Users size={24} />} path="/" />
        <NavItem label="Notifications" icon={<Bell size={24} />} path="/" />
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
};

const NavItem: React.FC<NavItemProps> = ({ label, icon, path }) => {
  return (
    <Link
      to={path}
      className="flex items-center gap-3 px-4 py-3 transition-all duration-400 hover:bg-base-300 hover:rounded-xl"
    >
      <div className="text-primary">{icon}</div>
      {/* Hide label on small screens */}
      <span className="text-sm font-semibold hidden md:block">{label}</span>
    </Link>
  );
};

export default Sidebar;
