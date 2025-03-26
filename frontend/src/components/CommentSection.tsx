import { useState } from "react";
import { Comment } from "../types/catches";
import { formatDistanceToNow } from "date-fns";
import { MenuIcon } from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useCatchStore } from "../store/useCatchStore";

interface Props {
  catchId: string;
  commentArray: Comment[];
}

const CommentSection = ({ catchId, commentArray }: Props) => {
  const { authenticatedUser } = useAuthStore();
  const { updateComment, deleteComment } = useCatchStore();

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");

  const handleEditSubmit = () => {
    updateComment(catchId, editingCommentId!, editedText);
    setEditingCommentId(null);
    setEditedText("");
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(catchId, commentId);
  };

  return (
    <>
      {commentArray.map((comment) => (
        <div
          key={comment._id}
          className="mb-3 pl-2 flex justify-between items-start"
        >
          <div className="flex-col items-center w-full">
            <span className="font-semibold mr-2">@{comment.user.username}</span>
            <span className="text-xs text-base-500 self-center">
              {comment.updatedAt > comment.createdAt
                ? `${formatDistanceToNow(comment.updatedAt)} (Edited)`
                : formatDistanceToNow(comment.createdAt)}
            </span>

            {/* Comment Content */}
            {editingCommentId === comment._id ? (
              <div className="mt-2 w-full">
                <input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditedText("");
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-base-600 leading-relaxed">{comment.text}</p>
            )}
          </div>

          <div className="relative">
            <div className="dropdown dropdown-left dropdown-center">
              <MenuIcon tabIndex={0} role="button" />
              <ul
                tabIndex={0}
                className="dropdown-content menu menu-sm bg-base-200 rounded-box z-1 w-24
                 p-2 shadow-sm"
              >
                {authenticatedUser?._id !== comment.user._id && (
                  <li>
                    <a className="text-red-500">Report</a>
                  </li>
                )}
                {authenticatedUser?._id == comment.user._id && (
                  <li>
                    <a
                      onClick={() => {
                        setEditingCommentId(comment._id);
                        setEditedText(comment.text);
                      }}
                    >
                      Edit
                    </a>
                  </li>
                )}
                {authenticatedUser?._id == comment.user._id && (
                  <li>
                    <a
                      className="text-red-500"
                      onClick={() => {
                        handleDeleteComment(comment._id);
                      }}
                    >
                      Delete
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default CommentSection;
