import React from "react";
import Sidebar from "../components/Sidebar";

const HomePage: React.FC = () => {
  return (
    <div className="text-base-content gap-2 grid grid-cols-6 md:grid-cols-4">
      {/* Sidebar */}
      <div className="col-span-1 pb-10">
        <Sidebar />
      </div>

      {/* Main Content */}
    </div>
  );
};

export default HomePage;
