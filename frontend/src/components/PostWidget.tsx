import { Catch } from "../types/catches";
import { formatDistanceToNow } from "date-fns";

interface Props {
  catchData: Catch;
}

const PostWidget = ({ catchData }: Props) => {
  const { username, fullName, profilePic } = catchData.user;

  return (
    <div className="max-w-full mx-auto bg-transparent border border-info  rounded-xl shadow-sm mb-6">
      <div className="p-6">
        <div className="flex justify-between">
          <div className="flex gap-5 align-middle">
            <img
              className="w-14 h-14 rounded-full object-cover"
              src={profilePic || "/avatar.png"}
              alt="Profile Picture"
            />
            <div>
              <h3 className="text-lg font-semibold">{fullName}</h3>
              <h4 className="text-sm text-gray-400">{username}</h4>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold pt-2">
              {formatDistanceToNow(new Date(catchData.createdAt), {
                addSuffix: true,
              })}
            </h4>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-lg font-semibold">{catchData.comments}</p>
          <img
            className="w-full max-h-[500px] object-cover rounded-lg mt-4"
            src={catchData.photo || "/avatar.png"}
            alt="Catch Image"
          />
          <p className="text-sm text-gray-400">{catchData.lake}</p>
        </div>
      </div>
    </div>
  );
};

export default PostWidget;
