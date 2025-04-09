import { useEffect, useState } from "react";
import { Fish, MapPin, Trophy } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { useProfileStore } from "../store/useProfileStore";
import { useCatchStore } from "../store/useCatchStore";
import { useAuthStore } from "../store/useAuthStore";
import { useConversationStore } from "../store/useConversationStore";
import ProfilePostWidget from "../components/ProfilePostWidget";
import PostWidget from "../components/PostWidget";
import { Catch } from "../types/catches";

const ProfilePage = () => {
  const { selectedUser, isLoading, fetchProfile, followUnfollowUser } = useProfileStore();
  const { catches, isFetchingCatches, fetchUserCatches } = useCatchStore();
  const { authenticatedUser } = useAuthStore();
  const { createConversation } = useConversationStore();
  const { username } = useParams();

  const [showStats, setShowStats] = useState(false); //CLICKING PROFILE PIC REVEALS STATS
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null); 
  const isCurrentUser = selectedUser?._id === authenticatedUser?._id;

  let isFollowing;
  if(!isCurrentUser) {
    isFollowing = selectedUser?.followers.includes(authenticatedUser!._id);
  }

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
      {isLoading && !selectedUser ? (
        <div>Loading...</div>
      ) : (
        <div className="py-6 flex justify-center items-center transition-all duration-500" >
          {/* Stats Slider*/}
          <div onClick={() => setShowStats(!showStats)}
            className={`absolute transition-transform-reverse duration-500 
        ${
          showStats
            ? " opacity-100 brightness-100  translate-x-1/3 "
            : "opacity-0 brightness-0 translate-x-1/4"
        }`}
          >
            <h3 className="text-xl text-white font-semibold mb-4">Personal Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-3 rounded font-medium text-gray-700">
                <Trophy className="inline mr-2" />
                Total Fish: 0
              </div>
              <div className="bg-gray-100 p-3 rounded font-medium text-gray-700">
                <Fish className="inline mr-2" />
                Personal Best: 0 kg
              </div>
              <div className="bg-gray-100 p-3 rounded font-medium text-gray-700">
                <MapPin className="inline mr-2" />
                Favourite Lake:
              </div>
              <div className="bg-gray-100 p-3 rounded font-medium text-gray-700">Favourite Hookbait:</div>
            </div>
          </div>

          {/* Profile Pic */}
          <div
            className={`w-1/3 text-center transition-transform-reverse duration-500 ${
              showStats ? "-translate-x-full " : "-translate-x-0 "
            }`}
          >
            <img
              onClick={() => setShowStats(!showStats)}
              src={selectedUser?.profilePic || "/avatar.png"}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
            />
            <h2 className="text-2xl text-white font-bold">{selectedUser?.fullName}</h2>

            <div className="flex justify-center space-x-4 mt-2">
              <div>Followers: {selectedUser?.followers.length}</div>
              <div>Following: {selectedUser?.following.length}</div>
            </div>
            {!isCurrentUser && (
              <div className="flex gap-3 justify-center mt-2">
                <button
                  className={`flex-auto w-1/4 py-2 btn btn-circle text-lg ${ isFollowing
                      ? " bg-blue-500 text-white hover:bg-blue-500/90 "
                      : "bg-white text-black  hover:bg-white hover:opacity-90"
                  }`}
                  onClick={() => handleFollowUnfollow()}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                  <Link to={`/messages`}
                  className={"flex-auto w-1/4 py-2 btn btn-circle text-lg bg-blue-500 text-white hover:bg-blue-500/90"}>
                <button
                  onClick={() => createConversation([{
                    _id: selectedUser!._id,
                    username: selectedUser!.username,
                    fullName: selectedUser!.fullName,
                    profilePic: selectedUser!.profilePic,
                  }])} 
                >
                  Message
                </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Catch Filters ---PROVISIONAL---
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
      </div> */}

      {/* My Catches ----NEED TO IMPLEMENT----*/}
      {isFetchingCatches ? (<div>Loading...</div>) : (
        <div className='w-full flex flex-wrap'>
        {catches && catches.map((catchData) => (
            <div key={catchData._id} className="lg:w-1/3 p-1" onClick={() => setSelectedCatch(catchData)}>
              <ProfilePostWidget catchData={catchData} />
            </div>
        ))}
        {isFetchingCatches && <div>Loading...</div>}
    </div>)}
    {selectedCatch && <div className="w-full h-full absolute top-0 left-0 bg-black/50" onClick={() => setSelectedCatch(null)} >
      <div className="w-full h-full flex justify-center items-center ">
        <div className="bg-black/80 rounded-lg shadow-lg" onClick={(e => e.stopPropagation())}>
          <PostWidget catchData={selectedCatch!} /> 
        </div>
        </div>
    </div>}

    </>
  );
};

export default ProfilePage;
