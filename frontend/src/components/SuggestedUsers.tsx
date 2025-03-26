import { Link } from "react-router-dom";
import { useProfileStore } from "../store/useProfileStore";
import { useEffect } from "react";
import { CheckIcon, TicketCheck } from "lucide-react";

const SuggestedUsers = () => {
  const {
    isFetchingSuggestedUser,
    suggestedUsers,
    fetchSuggestedUsers,
    followUnfollowUser,
  } = useProfileStore();

  const handleFollowUser = async (id: string) => {
    await followUnfollowUser(id);
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, [fetchSuggestedUsers]);

  if (isFetchingSuggestedUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="hidden lg:block mb-4 mx-2">
      <div className=" rounded-lg top-2 ">
        <p className="font-bold mb-4">Who to follow</p>
        <div className="flex flex-col gap-2">
          {/* item */}
          {suggestedUsers &&
            suggestedUsers?.map((user) => (
              <div
                className="p-3 flex items-center justify-between hover:bg-base-300 hover:rounded-xl"
                key={user._id}
              >
                <Link to={`/profile/${user.username}`} key={user._id}>
                  <div className="flex gap-2 items-center">
                    <div className="avatar">
                      <div className="w-8 rounded-full ">
                        <img src={"/avatar.png"} />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold tracking-tight truncate w-28">
                        {user.fullName}
                      </span>
                      <span className="text-sm text-slate-500">
                        @{user.username}
                      </span>
                    </div>
                  </div>
                </Link>

                <div>
                  <button
                    className={`text-black btn rounded-full btn-sm ${
                      user.isFollowing
                        ? " bg-blue-500 hover:bg-blue-500/90 "
                        : "bg-white    hover:bg-white hover:opacity-90 "
                    }`}
                    onClick={() => handleFollowUser(user._id)}
                  >
                    {user.isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
export default SuggestedUsers;
