import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, IdCard, Mail, User } from "lucide-react";

const SettingsPage = () => {
  const { authenticatedUser, isUpdatingProfile, updateProfile } =
    useAuthStore();
  const [selectedImg, setSelectedselectedImg] = useState<string>("");

  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [name, setName] = useState(authenticatedUser?.fullName);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result as string;
      setSelectedselectedImg(base64Image);

      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleUpdateName = async () => {
    if (authenticatedUser?.fullName == name) return;
    if (!name) return;
    setIsUpdatingName(false);
    await updateProfile({ fullName: name });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-base-100 rounded-xl p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold ">Settings</h1>
          <p className="mt-2">Your profile information</p>
        </div>

        {/* avatar upload section */}

        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={
                selectedImg || authenticatedUser?.profilePic || "/avatar.png"
              }
              alt="Profile"
              className="size-32 rounded-full object-cover border-4 "
            />
            <label
              htmlFor="avatar-upload"
              className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${
                    isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                  }
                `}
            >
              <Camera className="w-5 h-5 text-base-200" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUpdatingProfile}
              />
            </label>
          </div>
          <p className="text-sm text-zinc-400">
            {isUpdatingProfile
              ? "Uploading..."
              : "Click the camera icon to update your photo"}
          </p>
        </div>

        {/* profile info section */}

        <div className="space-y-6 ">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between pr-1">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <span
                onClick={handleUpdateName}
                className={
                  authenticatedUser?.fullName == name || !name
                    ? "text-xs text-neutral-500"
                    : "text-xs text-primary cursor-pointer hover:text-primary/70"
                }
              >
                Update Name
              </span>
            </div>
            <div
              onMouseLeave={() => {
                if (name) return setIsUpdatingName(false);
              }}
              onMouseOver={() => setIsUpdatingName(true)}
            >
              {isUpdatingName && (
                <input
                  className="px-4 py-2.5 bg-base-200 rounded-lg text-white inline-flex w-full"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              {!isUpdatingName && (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg">{name}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <IdCard className="w-4 h-4" />
              Username
            </div>
            <p className="px-4 py-2.5 bg-base-200 rounded-lg  pointer-events-none">
              {authenticatedUser?.username}
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </div>
            <p className="px-4 py-2.5 bg-base-200 rounded-lg  pointer-events-none">
              {authenticatedUser?.email}
            </p>
          </div>
        </div>

        {/* account info section */}

        <div className="mt-6 bg-base-200 rounded-xl p-6">
          <h2 className="text-lg font-medium  mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-zinc-700">
              <span>Member Since</span>
              <span>{authenticatedUser?.createdAt?.split("T")[0]}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Account Status</span>
              <span className="text-green-500">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
