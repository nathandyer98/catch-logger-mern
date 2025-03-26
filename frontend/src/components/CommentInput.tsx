import { useState } from "react";
import { useCatchStore } from "../store/useCatchStore";
import { CommentFormData } from "../types/forms";

interface Props {
  catchId: string;
}
const CommentInput = ({ catchId }: Props) => {
  const { addComment } = useCatchStore();

  const [comment, setComment] = useState<CommentFormData>({ text: "" });

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!comment.text) return alert("Please enter a comment");

    addComment(catchId, comment.text);
    setComment({ text: "" });
  };

  return (
    <form onSubmit={handleCommentSubmit} className="mt-3 flex">
      <input
        type="text"
        value={comment.text}
        onChange={(e) => setComment({ text: e.target.value })}
        placeholder="Add a comment..."
        className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-r-md text-sm hover:bg-blue-600 focus:outline-none transition-colors duration-200"
      >
        Post
      </button>
    </form>
  );
};

export default CommentInput;
