import React, { useEffect } from "react";
import { useProfileStore } from "../store/useProfileStore";
import { Fish, MapPin, Trophy } from "lucide-react";

interface ProfilePageProps {
  userId?: string; // Optional userId to fetch a specific profile
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userId }) => {
  const { selectedUser, isLoading, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile(userId);
  }, [userId, fetchProfile]);

  if (isLoading) return <div>Loading...</div>;

  console.log(selectedUser);

  return (
    <div className="pt-24 p-4">
      <div className="text-center">
        <img
          src={selectedUser?.profilePic || "/avatar.png"}
          alt="Profile"
          className="w-32 h-32 rounded-full mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold">{selectedUser?.fullName}</h2>
        <div className="flex justify-center space-x-4 mt-2">
          <div>Followers: {selectedUser?.friends}</div>
          <div>Following: 178</div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Personal Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-3 rounded">
            <Trophy className="inline mr-2" />
            Total Fish: 0
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <Fish className="inline mr-2" />
            Personal Best: 0 kg
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <MapPin className="inline mr-2" />
            Favourite Lake:
          </div>
          <div className="bg-gray-100 p-3 rounded">Favourite Hookbait:</div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Catch Filters</h3>
        <div className="flex space-x-4 mb-4">
          <input
            type="date"
            placeholder="From Date"
            className="p-2 border rounded"
          />
          <input
            type="date"
            placeholder="To Date"
            className="p-2 border rounded"
          />
          <select className="p-2 border rounded">
            <option value="">All Lakes</option>
            <option value="Lake Erie">Lake Erie</option>
            <option value="Lake Michigan">Lake Michigan</option>
          </select>
          <select className="p-2 border rounded">
            <option value="">All Fish</option>
            <option value="Walleye">Walleye</option>
            <option value="Bass">Bass</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">My Catches</h3>
        {selectedUser?.catches?.length ? (
          selectedUser.catches.map((catchItem) => (
            <div key={catchItem._id} className="catch-card">
              {/* Render each catch card */}
              <p>{catchItem.species}</p>
            </div>
          ))
        ) : (
          <p>No catches yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
