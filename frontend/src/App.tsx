import Navbar from "./components/Navbar";

import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import OceanBackground from "./components/OceanBackground";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import ProfilePage from "./pages/ProfilePage";

const App = () => {
  const { authenticatedUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authenticatedUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div className="container mx-auto px-4 h-screen overflow-hidden">
      <Navbar />
      <div className="grid grid-cols-5 gap-10 h-full mb-52">
        <div className="col-span-1">{authenticatedUser && <Sidebar />}</div>

        <div className="col-span-3 pb-24 overflow-y-scroll">
          <Routes>
            <Route
              path="/"
              element={
                authenticatedUser ? <HomePage /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/signup"
              element={
                !authenticatedUser ? <SignUpPage /> : <Navigate to="/" />
              }
            />
            <Route
              path="/login"
              element={!authenticatedUser ? <LoginPage /> : <Navigate to="/" />}
            />
            <Route
              path="/profile/:username"
              element={
                authenticatedUser ? <ProfilePage /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/settings"
              element={
                authenticatedUser ? <SettingsPage /> : <Navigate to="/login" />
              }
            />
          </Routes>
        </div>
        <Toaster position="bottom-center" />
        <div className="relative flex items-center justify-center">
          <OceanBackground />
        </div>
      </div>
    </div>
  );
};

export default App;
