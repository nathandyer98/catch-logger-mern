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
import NotificationPage from "./pages/NotificationPage";
import SuggestedUsers from "./components/SuggestedUsers";
import MessagesPage from "./pages/MessagesPage";
import { useSocketStore } from "./store/useSocketStore";

const App = () => {
  const { authenticatedUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const { connect, disconnect, socket } = useSocketStore.getState();
    let didConnect = false; 
  
    if (authenticatedUser?._id && !socket?.connected) {
        console.log('Effect executing: Calling connect...');
        connect(authenticatedUser?._id);
        didConnect = true;
    }
    return () => {
        console.log('Effect cleaning up...');
        if (didConnect) {
          console.log('Cleanup: Calling disconnect...');
          disconnect();
        }
    };
  }, [authenticatedUser?._id]);
  

  if (isCheckingAuth && !authenticatedUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

    return (
      <div className="container mx-auto px-4 h-screen flex flex-col overflow-hidden">
        <div className=" flex-shrink-0">
          <Navbar/>
        </div>
        <div className="flex flex-1 gap-10 overflow-hidden">

          {/* Sidebar - Left-side fixed */}
          <div className="w-1/5 flex-shrink-0">
            {authenticatedUser && <Sidebar />}
          </div>
          
          {/* Main content - scrollable */}
          <div className="w-3/5 overflow-y-auto pb-24" style={{ scrollbarWidth: 'none' }}>
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
                path="/messages"
                element={
                  authenticatedUser ? <MessagesPage /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/notifications"
                element={
                  authenticatedUser ? <NotificationPage /> : <Navigate to="/login" />
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
          
          {/* Suggested Users - Right-side fixed */}
          <div className="w-1/5 flex-shrink-0">
            {authenticatedUser && <SuggestedUsers />}
          </div>
        </div>
        
        {/* Toaster */}
        <Toaster position="bottom-center" />
        
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <OceanBackground />
        </div>
      </div>
    );
};

export default App;
