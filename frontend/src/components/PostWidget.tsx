import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MenuIcon,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  Heart,
} from "lucide-react";

import { Catch } from "../types/catches";
import { useAuthStore } from "../store/useAuthStore";
import { useCatchStore } from "../store/useCatchStore";

import CommentSection from "./CommentSection";
import CommentInput from "./CommentInput";

interface Props {
  catchData: Catch;
}

const PostWidget = ({ catchData }: Props) => {
  const { _id, username, fullName, profilePic } = catchData.user;

  const { authenticatedUser } = useAuthStore();
  const { likeUnlikeCatch, deleteCatch } = useCatchStore();

  const [showDetails, setShowDetails] = useState(false);
  const [openComment, setOpenComment] = useState(false);

  const handleLikeUnlike = (id: string) => {
    likeUnlikeCatch(id);
  };

  const handleDelete = (id: string) => {
    deleteCatch(id);
  };

  return (
    <div className="max-w-full mx-auto bg-transparent/25 shadow-md rounded-xl my-4 p-4">
      {/* Header - Profile Pic, Name, Username, Posted at */}
      <div className="flex justify-between">
        <div className="flex gap-5 align-middle">
          <img
            className="w-14 h-14 rounded-full object-cover"
            src={profilePic || "/avatar.png"}
            alt="Profile Picture"
          />
          <div>
            <h3 className="text-lg font-semibold">{fullName}</h3>
            <h4 className="text-sm text-gray-400">{`@${username}`}</h4>
          </div>
        </div>
        <div className="flex-col text-right ">
          <div className="dropdown dropdown-left dropdown-center">
            <MenuIcon tabIndex={0} role="button" />
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-200 rounded-box z-1 w-52 p-2 shadow-sm"
            >
              {authenticatedUser?._id !== _id && (
                <li>
                  <a className="text-red-500">Report</a>
                </li>
              )}
              {authenticatedUser?._id == _id && (
                <li>
                  <a>Edit</a>
                </li>
              )}
              {authenticatedUser?._id == _id && (
                <li>
                  <a
                    className="text-red-500"
                    onClick={() => {
                      console.log(catchData._id);
                      handleDelete(catchData._id);
                    }}
                  >
                    Delete
                  </a>
                </li>
              )}
            </ul>
          </div>
          <h4 className="text-sm font-semibold top-0">
            {formatDistanceToNow(new Date(catchData.createdAt), {
              addSuffix: true,
            })}
          </h4>
        </div>
      </div>

      {/** Picture container  */}
      <div>
        <img
          className="w-full max-h-[500px] object-cover rounded-lg mt-4"
          src={catchData.photo || "/avatar.png"}
          alt="Catch Image"
        />
      </div>

      {/** Post Content  */}
      <div className="p-3 justify-evenly">
        <div className="flex justify-between align-middle text-center ">
          <p className="text-sm">{catchData.text}</p>
          <p className="text-sm font-semibold">📍 {catchData.lake}</p>
        </div>

        {/* Expandable details section */}
        <div className="mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center text-sm text-blue-600 font-medium transition-all duration-200 hover:text-blue-700"
          >
            {showDetails ? (
              <>
                <ChevronUp
                  size={16}
                  className="mr-1 transition-transform duration-300"
                />
                Hide catch details
              </>
            ) : (
              <>
                <ChevronDown
                  size={16}
                  className="mr-1 transition-transform duration-300"
                />
                View catch details
              </>
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showDetails ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-3 bg-primary/20 rounded-md text-sm">
              <div className="grid grid-cols-2 gap-2">
                {catchData.rig && (
                  <div>
                    <p className="text-gray-500">Rig:</p>
                    <p className="font-medium">{catchData.rig}</p>
                  </div>
                )}
                {catchData.bait && (
                  <div>
                    <p className="text-gray-500">Bait:</p>
                    <p className="font-medium">{catchData.bait}</p>
                  </div>
                )}
                {catchData.distance !== 0 && (
                  <div>
                    <p className="text-gray-500">Distance:</p>
                    <p className="font-medium">{catchData.distance}</p>
                  </div>
                )}
                {catchData.location && (
                  <div>
                    <p className="text-gray-500">Location:</p>
                    <p className="font-medium">{catchData.location}</p>
                  </div>
                )}
                {catchData.weight && (
                  <div>
                    <p className="text-gray-500">Weight:</p>
                    <p className="font-medium">{`${catchData.weight}lbs`}</p>
                  </div>
                )}
                {catchData.dateCaught && (
                  <div>
                    <p className="text-gray-500">Date:</p>
                    <p className="font-medium">
                      {new Date(catchData.dateCaught).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Like and comment section */}
      <div className="flex items-center justify-between border-t border-b border-white/25 py-2 px-1">
        <button
          onClick={() => handleLikeUnlike(catchData._id)}
          className={`flex items-center transition-colors duration-200 ${
            authenticatedUser?._id &&
            catchData.likes.includes(authenticatedUser._id)
              ? "text-red-500"
              : "text-gray-500"
          }`}
        >
          <Heart
            size={20}
            className={`transition-all duration-300 transform ${
              authenticatedUser?._id &&
              catchData.likes.includes(authenticatedUser._id)
                ? "fill-red-500 scale-110"
                : "scale-100"
            }`}
          />
          <span className="ml-2">{catchData.likes.length}</span>
        </button>
        <button
          onClick={() => setOpenComment(!openComment)}
          className="flex items-center text-gray-500 "
        >
          <MessageCircle
            className="hover:text-gray-200 transition-all duration-200"
            size={20}
          />
          <span className="ml-2">{catchData.comments.length}</span>
        </button>
      </div>

      {/* Comments section */}
      <div
        className={`mt-3 transition-all duration-400 ease-in-out ${
          openComment
            ? "max-h-60 opacity-100 mt-3 overflow-y-scroll"
            : "max-h-0 opacity-0 "
        }`}
      >
        {openComment && (
          <CommentSection
            catchId={catchData._id}
            commentArray={catchData.comments}
          />
        )}
      </div>
      {/* Comment form */}
      {openComment && <CommentInput catchId={catchData._id} />}
    </div>
  );
};

export default PostWidget;
