import { Bell, Home, MessageSquare, Settings, Users } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="">
      {/* Navigation Links */}
      <nav className="flex flex-col rounded-2xl w-auto">
        <NavItem label="Home" icon={<Home size={24} />} />
        <NavItem label="Groups" icon={<Users size={24} />} />
        <NavItem label="Notifications" icon={<Bell size={24} />} />
        <NavItem label="Messages" icon={<MessageSquare size={24} />} />
        <NavItem label="Settings" icon={<Settings size={24} />} />
      </nav>
    </div>
  );
};

// Navigation Item
type NavItemProps = {
  label: string;
  icon: React.ReactNode;
};

const NavItem: React.FC<NavItemProps> = ({ label, icon }) => {
  return (
    <a
      href="#"
      className="flex items-center gap-3 px-4 py-3 transition-all duration-400 hover:bg-base-300 hover:rounded-xl"
    >
      <div className="text-primary">{icon}</div>
      {/* Hide label on small screens */}
      <span className="text-sm font-semibold hidden md:block">{label}</span>
    </a>
  );
};

export default Sidebar;
