import { useEffect, useState } from "react";
import { Fish, MapPin, Trophy } from "lucide-react";
import { useParams } from "react-router-dom";

import { useProfileStore } from "../store/useProfileStore";
import { useCatchStore } from "../store/useCatchStore";
import { useAuthStore } from "../store/useAuthStore";

const ProfilePage = () => {
  const { selectedUser, isLoading, fetchProfile, followUnfollowUser } =
    useProfileStore();
  const { userCatches, isFetchingCatches, fetchUserCatches } = useCatchStore();
  const { authenticatedUser } = useAuthStore();
  const { username } = useParams();

  const [showStats, setShowStats] = useState(false); //CLICKING PROFILE PIC REVEALS STATS
  const isCurrentUser = selectedUser?._id === authenticatedUser?._id;

  useEffect(() => {
    if (username) {
      fetchProfile(username);
      fetchUserCatches(username);
    }
  }, [fetchProfile, fetchUserCatches, username]);

  const handleFollowUnfollow = async () => {
    if (selectedUser) {
      await followUnfollowUser(selectedUser._id);
    }
  };

  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="py-6 flex justify-center items-center transition-all duration-500">
          {/* Stats Slider*/}
          <div
            className={`absolute transition-transform-reverse duration-500 
        ${
          showStats
            ? " opacity-100 brightness-100  translate-x-full "
            : "opacity-0 brightness-0 translate-x-1/4"
        }`}
          >
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

          {/* Profile Pic */}
          <div
            className={`text-center transition-transform-reverse duration-500 ${
              showStats ? "-translate-x-full " : "-translate-x-0 "
            }`}
          >
            <img
              onClick={() => setShowStats(!showStats)}
              src={selectedUser?.profilePic || "/avatar.png"}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold">{selectedUser?.fullName}</h2>

            <div className="flex justify-center space-x-4 mt-2">
              <div>Followers: {selectedUser?.followers.length}</div>
              <div>Following: {selectedUser?.following.length}</div>
            </div>
            {!isCurrentUser && (
              <div className="grid grid-cols-2 gap-3 justify-center mt-2 ">
                <button
                  className="col-span-1  py-2 text-white rounded bg-blue-600 hover:bg-blue-900 transition"
                  onClick={() => handleFollowUnfollow()}
                >
                  Follow/Unfollow
                </button>

                <button
                  className=" col-span-1  py-2 text-white rounded bg-blue-600 hover:bg-blue-900 transition"
                  onClick={() => console.log("Message button clicked")} // Replace with actual logic
                >
                  Message
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Catch Filters ---PROVISIONAL--- */}
      <div className="mt">
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

      {/* My Catches ----NEED TO IMPLEMENT----*/}
      {isFetchingCatches ? (
        <div>Loading...</div>
      ) : (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">My Catches</h3>
          {userCatches?.length ? (
            userCatches.map((catchItem) => (
              <div key={catchItem._id} className="catch-card">
                {/* Render each catch card */}
                <p>{catchItem.species}</p>
              </div>
            ))
          ) : (
            <p>No catches yet.</p>
          )}
        </div>
      )}
    </>
  );
};

export default ProfilePage;
