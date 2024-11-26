import { Link } from "react-router-dom";
import { FishSymbol, Settings } from "lucide-react";

const NavBar = () => {
  return (
    <header className="bg-opacity-0 fixed w-full top-0 z-40">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:brightness-125 transition-all"
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
              className={`
              btn btn-sm gap-2 transition-colors
              
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
export default NavBar;
