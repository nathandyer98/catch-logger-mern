import { Link } from "react-router-dom";
import { FishSymbol, LogOut, Settings, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const NavBar = () => {
  const { authenticatedUser, logout } = useAuthStore();

  return (
    <header className="bg-opacity-0 fixed w-full top-0 z-40">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-3.5 hover:brightness-125 transition-all"
            >
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FishSymbol className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Catch Logger</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={"/settings"}
              className={`btn btn-sm gap-2 transition-colors`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            {authenticatedUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button
                  className="flex pl-2 gap-2 items-center"
                  onClick={logout}
                >
                  <LogOut className="size-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default NavBar;
