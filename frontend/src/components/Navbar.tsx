import { Link } from "react-router-dom";
import { FishSymbol, LogOut, User, Search } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";

const NavBar = () => {
  const { authenticatedUser, logout } = useAuthStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handleExpand = () => setIsExpanded(true);
  const handleCollapse = () => {
    if (searchText.trim() === "") setIsExpanded(false);
  };

  return (
    <header className="h-16 w-full bg-opacity-0 top-0 z-40">
      <div className="h-full grid grid-cols-3">
        {/* Left Side */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-3.5 hover:brightness-125 transition-all"
          >
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FishSymbol className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold hidden lg:block">Catch Logger</h1>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-center">
          {authenticatedUser && (
            <>
              <div
                className={`relative flex items-center justify-center ${
                  !isExpanded
                    ? "w-20 "
                    : "w-80 text-primary bg-white rounded-full borderborder-gray-300"
                } transition-all duration-300  focus-within:shadow-md`}
              >
                <button
                  onMouseOver={handleExpand}
                  className="flex items-center justify-center w-10 h-10 text-gray-500"
                >
                  <Search size={20} />
                </button>
                <input
                  type="text"
                  className={`${
                    isExpanded ? "w-full" : "w-0"
                  } h-full w-full px-2 text-sm text-gray-700 bg-transparent outline-none transition-all duration-300`}
                  placeholder={isExpanded ? "Search Users" : ""}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onBlur={handleCollapse}
                  onFocus={handleExpand}
                />
              </div>
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 justify-end ">
          {authenticatedUser && (
            <>
              <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                <User className="size-5" />
                <span className="hidden lg:inline">Profile</span>
              </Link>

              <button className="flex pl-2 gap-2 items-center" onClick={logout}>
                <LogOut className="size-6 hover:text-red-500 transition-all duration-300" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default NavBar;
